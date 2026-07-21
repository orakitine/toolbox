#!/usr/bin/env node
// sim-bridge.mjs — driver-free measurement channel for the iOS Simulator.
//
// WHY THIS EXISTS
// safaridriver and CGEvent gestures cannot coexist. iOS raises the native
// "Safari is Running an Automated Test" alert on the first synthetic touch during
// an active WebDriver session (it treats a CGEvent drag as a human reclaiming the
// device). That alert swallows the gesture and every gesture after it — so the
// toolbar never collapses and the page receives zero touch events.
//
// This bridge replaces WebDriver for GESTURE work. It proxies the target site
// through localhost, injecting an agent script into every HTML response. The
// agent posts telemetry out and long-polls for JS to eval — giving you the same
// inject/measure power with NO automation session, so gestures work natively.
//
// Usage:
//   node sim-bridge.mjs serve http://localhost:6006 [--port 8899] [--hud 0]
//                              [--fresh] [--init-js file.js]
//   node sim-bridge.mjs probe                     # latest telemetry as JSON
//   node sim-bridge.mjs eval "window.scrollY"     # expression — value returned
//   node sim-bridge.mjs eval "var x=1; return x"  # statements need `return`
//   node sim-bridge.mjs eval "..." --match /book  # only answer from a client
//                                                 # whose URL contains /book
//   node sim-bridge.mjs clients                   # connected pages + last-seen
//   node sim-bridge.mjs console [n]               # last n console/error entries
//   node sim-bridge.mjs log [n]                   # last n telemetry frames
//
// --fresh    pick a random free port — a NEW localhost origin, so Safari's
//            (very sticky) HTML/JS cache from earlier runs cannot leak in.
//            Prints `export SIM_BRIDGE_PORT=<port>` for follow-up commands.
// --init-js  inline this file's JS immediately after the agent, i.e. BEFORE any
//            page script runs — install message taps / hooks that must win the
//            race against the page's own boot code.
//
// Every eval/probe answer names the client that answered (`answeredBy`) and
// warns when several pages are connected — background tabs suspend but can
// wake and steal an eval, which silently corrupts measurements otherwise.
//
// Then point the device at the PROXY, not the target:
//   xcrun simctl openurl booted "http://localhost:8899/iframe.html?id=…"
//   swift sim-scroll.swift 0.8 0.25 60
//   xcrun simctl io booted screenshot shot.png    # captures Safari chrome too
//
// No dependencies. Node 18+ (uses global fetch).

import http from 'node:http'
import { readFileSync } from 'node:fs'

const [, , cmd, ...rest] = process.argv
const argOf = (flag, dflt) => {
  const i = rest.indexOf(flag)
  return i >= 0 ? rest[i + 1] : dflt
}
const hasFlag = (flag) => rest.includes(flag)
const PORT = Number(process.env.SIM_BRIDGE_PORT || argOf('--port', 8899))
const BASE = `http://localhost:${PORT}`

// Clients silent for longer than this are treated as suspended background tabs.
const CLIENT_ACTIVE_MS = 12000

// ---------------------------------------------------------------- agent ----
// Injected into every proxied HTML document. Runs in iOS Safari.
const AGENT = (hud) => `
<script>
(function () {
  if (window.__simAgent) return;
  window.__simAgent = true;
  var HUD = ${hud ? 'true' : 'false'};
  var CID = String(Math.random()).slice(2, 10);

  function px(v) {
    var d = document.createElement('div');
    d.style.cssText = 'position:absolute;top:0;left:0;width:1px;visibility:hidden;pointer-events:none;height:' + v;
    document.documentElement.appendChild(d);
    var h = parseFloat(getComputedStyle(d).height);
    d.remove();
    return h;
  }

  // ---- console + error ring buffer (read with: sim-bridge.mjs console) ----
  var LOGMAX = 200;
  var buf = window.__simConsole = [];
  function record(kind, args) {
    var msg;
    try {
      msg = Array.prototype.map.call(args, function (a) {
        if (typeof a === 'string') return a;
        try { return JSON.stringify(a); } catch (e) { return String(a); }
      }).join(' ');
    } catch (e) { msg = '<unserializable>'; }
    buf.push({ t: Date.now(), kind: kind, msg: msg.slice(0, 500) });
    if (buf.length > LOGMAX) buf.shift();
  }
  ['log', 'info', 'warn', 'error'].forEach(function (k) {
    var orig = console[k];
    console[k] = function () { record(k, arguments); return orig.apply(console, arguments); };
  });
  addEventListener('error', function (e) {
    record('jserror', [e.message + ' @ ' + (e.filename || '?') + ':' + (e.lineno || '?')]);
  });
  addEventListener('unhandledrejection', function (e) {
    record('unhandledrejection', [String(e.reason && e.reason.stack || e.reason)]);
  });

  // Baseline captured before any toolbar collapse. Growth from THIS is the
  // only reliable collapse signal — absolute px thresholds are version-specific.
  var vv = window.visualViewport;
  window.__baseline = { vvh: vv.height, inner: window.innerHeight };

  window.__probe = function () {
    return {
      t: Date.now(),
      units: { dvh: px('100dvh'), svh: px('100svh'), lvh: px('100lvh'), vh: px('100vh'), pct_of_ICB: px('100%') },
      viewport: {
        visual_h: vv.height, visual_w: vv.width, offsetTop: vv.offsetTop, scale: vv.scale,
        inner_h: window.innerHeight, scrollY: Math.round(window.scrollY),
        scrollH: document.documentElement.scrollHeight, dpr: window.devicePixelRatio
      },
      baseline: window.__baseline,
      grew: +(vv.height - window.__baseline.vvh).toFixed(1),
      collapsed: (vv.height - window.__baseline.vvh) > 8,
      focus: { active: document.activeElement && document.activeElement.id || null,
               focus_visible: (document.querySelector(':focus-visible') || {}).id || null },
      safeArea: getComputedStyle(document.documentElement).getPropertyValue('--sim-sat') || null
    };
  };

  // ---- HUD: paint numbers into the page so simctl screenshots carry them ----
  var hudEl;
  if (HUD) {
    hudEl = document.createElement('div');
    hudEl.id = '__simHud';
    hudEl.style.cssText = 'position:fixed;right:6px;bottom:6px;z-index:2147483647;' +
      'background:rgba(0,0,0,.86);color:#0f0;font:11px/1.3 ui-monospace,Menlo,monospace;' +
      'padding:6px 8px;border-radius:6px;white-space:pre;pointer-events:none';
    var mount = function () { document.body && document.body.appendChild(hudEl); };
    document.readyState === 'loading' ? addEventListener('DOMContentLoaded', mount) : mount();
  }

  var last = null;
  function tick() {
    var p;
    try { p = window.__probe(); } catch (e) { return; }
    if (hudEl) {
      hudEl.textContent =
        'dvh ' + p.units.dvh + '  svh ' + p.units.svh + '  lvh ' + p.units.lvh + '\\n' +
        'vh  ' + p.units.vh + '  100% ' + p.units.pct_of_ICB + '\\n' +
        'visual ' + p.viewport.visual_h + '  inner ' + p.viewport.inner_h + '\\n' +
        'scrollY ' + p.viewport.scrollY + '  grew ' + p.grew + (p.collapsed ? ' COLLAPSED' : '') + '\\n' +
        'focus ' + (p.focus.active || '-') + '  fv ' + (p.focus.focus_visible || '-');
    }
    // scrollH must be in the signature: the first frame can capture it before
    // layout settles (reads ~= viewport height), and without it here that stale
    // value sticks until a scroll changes another field.
    var sig = p.viewport.visual_h + ':' + p.viewport.scrollY + ':' + p.viewport.scrollH +
              ':' + p.focus.active + ':' + p.focus.focus_visible;
    if (sig !== last) {
      last = sig;
      p.client = { cid: CID, url: location.href };
      try { fetch('/__t', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p), keepalive: true }); } catch (e) {}
    }
  }
  setInterval(tick, 200);
  tick();

  // ---- command channel: long-poll for JS to eval, post the result back ----
  // Bare expressions are auto-wrapped in "return (...)"; multi-statement
  // scripts run as a function body and need an explicit "return".
  function run(js) {
    var fn = null;
    try { fn = new Function('"use strict"; return (\\n' + js + '\\n)'); } catch (e) { fn = null; }
    if (!fn) fn = new Function(js);
    return fn();
  }
  function poll() {
    fetch('/__cmd?cid=' + CID + '&url=' + encodeURIComponent(location.href))
      .then(function (r) { return r.status === 200 ? r.json() : null; })
      .then(function (c) {
        if (!c) return;
        var out, err = null, hint = null;
        try { out = run(c.js); } catch (e) { err = String(e && e.stack || e); }
        if (out === undefined && !err && !/\\breturn\\b/.test(c.js)) {
          hint = 'returned undefined — if this was a multi-statement script, add an explicit "return"';
        }
        return fetch('/__r', { method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id: c.id, result: out === undefined ? null : out, error: err,
                                 hint: hint, client: { cid: CID, url: location.href } }) });
      })
      .catch(function () {})
      .then(function () { setTimeout(poll, 60); });
  }
  poll();
})();
</script>`

// ---------------------------------------------------------------- server ----
async function serve() {
  const target = rest.find((a) => a.startsWith('http'))
  if (!target) {
    console.error('usage: node sim-bridge.mjs serve <targetOrigin> [--port 8899] [--hud 0] [--fresh] [--init-js file.js]')
    process.exit(2)
  }
  const origin = new URL(target).origin
  const hud = argOf('--hud', '1') !== '0'
  // --fresh port pool is finite — a long campaign can re-land on a used port
  // (and its cache); if a run looks stale, check the printed port against
  // earlier runs or hand-pick one.
  const port = hasFlag('--fresh') ? 8200 + Math.floor(Math.random() * 800) : PORT
  const base = `http://localhost:${port}`
  const initJsPath = argOf('--init-js', null)
  const initTag = initJsPath ? `\n<script>\n${readFileSync(initJsPath, 'utf8')}\n</script>` : ''

  const state = { latest: null, log: [], queue: [], results: new Map(), clients: new Map() }

  const seen = (client) => {
    if (!client || !client.cid) return
    state.clients.set(client.cid, { url: client.url, lastSeen: Date.now() })
  }
  const activeClients = () =>
    [...state.clients.entries()]
      .filter(([, c]) => Date.now() - c.lastSeen < CLIENT_ACTIVE_MS)
      .map(([cid, c]) => ({ cid, url: c.url, silentMs: Date.now() - c.lastSeen }))

  const body = (req) =>
    new Promise((res) => {
      let b = ''
      req.on('data', (c) => (b += c))
      req.on('end', () => res(b))
    })
  const json = (res, code, obj) => {
    res.writeHead(code, { 'content-type': 'application/json' })
    res.end(JSON.stringify(obj))
  }

  http
    .createServer(async (req, res) => {
      const url = new URL(req.url, base)

      // --- local control endpoints (never proxied) ---
      if (url.pathname === '/__t') {
        const p = JSON.parse((await body(req)) || '{}')
        seen(p.client)
        state.latest = p
        state.log.push(p)
        if (state.log.length > 500) state.log.shift()
        return json(res, 200, { ok: true })
      }
      if (url.pathname === '/__state') return json(res, 200, state.latest || {})
      if (url.pathname === '/__log') return json(res, 200, state.log.slice(-Number(url.searchParams.get('n') || 20))) // eslint-disable-line
      if (url.pathname === '/__clients') return json(res, 200, activeClients())
      if (url.pathname === '/__push') {
        const { js, match } = JSON.parse((await body(req)) || '{}')
        const id = String(Math.random()).slice(2)
        state.queue.push({ id, js, match: match || null })
        // hold until the agent reports back (or times out)
        const started = Date.now()
        const wait = setInterval(() => {
          if (state.results.has(id)) {
            clearInterval(wait)
            const r = state.results.get(id)
            state.results.delete(id)
            const others = activeClients().filter((c) => c.cid !== (r.client && r.client.cid))
            const out = { result: r.result, error: r.error }
            if (r.hint) out.hint = r.hint
            out.answeredBy = r.client ? r.client.url : null
            if (others.length) {
              out.warning = `${others.length + 1} clients connected — pass --match <url-substring> to target one`
              out.otherClients = others.map((c) => c.url)
            }
            json(res, 200, out)
          } else if (Date.now() - started > 15000) {
            clearInterval(wait)
            const qi = state.queue.findIndex((q) => q.id === id)
            if (qi >= 0) state.queue.splice(qi, 1)
            const act = activeClients()
            json(res, 504, {
              error: 'agent did not respond — is the page open (and frontmost) in the Simulator?',
              activeClients: act.map((c) => c.url),
              ...(act.length === 0 ? {} : { hint: 'clients exist but none matched/answered — background tabs are suspended by iOS' }),
            })
          }
        }, 50)
        return
      }
      if (url.pathname === '/__cmd') {
        const client = { cid: url.searchParams.get('cid'), url: url.searchParams.get('url') }
        seen(client)
        const take = () => {
          const i = state.queue.findIndex((q) => !q.match || (client.url || '').includes(q.match))
          return i >= 0 ? state.queue.splice(i, 1)[0] : null
        }
        const next = take()
        if (next) return json(res, 200, next)
        // long-poll: hold ~5s so the agent isn't hammering
        const to = setTimeout(() => {
          const n2 = take()
          n2 ? json(res, 200, n2) : (res.writeHead(204), res.end())
        }, 5000)
        res.on('close', () => clearTimeout(to))
        return
      }
      if (url.pathname === '/__r') {
        const r = JSON.parse((await body(req)) || '{}')
        seen(r.client)
        state.results.set(r.id, r)
        return json(res, 200, { ok: true })
      }

      // --- transparent proxy, injecting the agent into HTML ---
      try {
        const upstream = await fetch(origin + url.pathname + url.search, {
          method: req.method,
          headers: { ...req.headers, host: new URL(origin).host },
          body: ['GET', 'HEAD'].includes(req.method) ? undefined : await body(req),
          redirect: 'manual',
        })
        const ct = upstream.headers.get('content-type') || ''
        const headers = Object.fromEntries(upstream.headers)
        delete headers['content-encoding']
        delete headers['content-length']
        delete headers['content-security-policy'] // CSP would block the injected agent

        if (ct.includes('text/html')) {
          let html = await upstream.text()
          const tag = AGENT(hud) + initTag
          html = html.includes('</head>')
            ? html.replace('</head>', tag + '</head>')
            : tag + html
          headers['content-type'] = 'text/html; charset=utf-8'
          res.writeHead(upstream.status, headers)
          return res.end(html)
        }
        res.writeHead(upstream.status, headers)
        res.end(Buffer.from(await upstream.arrayBuffer()))
      } catch (e) {
        res.writeHead(502, { 'content-type': 'text/plain' })
        res.end('bridge upstream error: ' + e.message)
      }
    })
    .listen(port, () => {
      console.log(`SIM_BRIDGE listening ${base} -> ${origin} (hud=${hud}${initJsPath ? `, init-js=${initJsPath}` : ''})`)
      if (hasFlag('--fresh')) console.log(`fresh origin — for follow-up commands: export SIM_BRIDGE_PORT=${port}`)
      console.log(`open on device: xcrun simctl openurl booted "${base}/"`)
    })
    .on('error', (e) => {
      if (e.code === 'EADDRINUSE' && hasFlag('--fresh')) return serve() // roll another port
      throw e
    })
}

// ---------------------------------------------------------------- client ----
const get = async (p) => {
  const r = await fetch(BASE + p)
  return r.json()
}

switch (cmd) {
  case 'serve':
    await serve()
    break
  case 'probe':
    console.log(JSON.stringify(await get('/__state'), null, 1))
    break
  case 'log':
    console.log(JSON.stringify(await get(`/__log?n=${rest[0] || 20}`), null, 1))
    break
  case 'clients':
    console.log(JSON.stringify(await get('/__clients'), null, 1))
    break
  case 'console': {
    const n = Number(rest.find((a) => /^\d+$/.test(a)) || 50)
    const r = await fetch(BASE + '/__push', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ js: `return (window.__simConsole || []).slice(-${n})`, match: argOf('--match', null) }),
    })
    console.log(JSON.stringify(await r.json(), null, 1))
    break
  }
  case 'eval': {
    // js = first non-flag arg, so `eval --match /book "<js>"` also works
    const matchVal = argOf('--match', null)
    const js = rest.find((a, i) => !a.startsWith('--') && rest[i - 1] !== '--match')
    const r = await fetch(BASE + '/__push', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ js, match: matchVal }),
    })
    console.log(JSON.stringify(await r.json(), null, 1))
    break
  }
  default:
    console.error('usage: sim-bridge.mjs serve <origin> [--fresh] [--init-js f.js] | probe | eval "<js>" [--match s] | clients | console [n] | log [n]')
    process.exit(2)
}
