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
//   node sim-bridge.mjs probe                     # latest telemetry as JSON
//   node sim-bridge.mjs eval "return window.scrollY"
//   node sim-bridge.mjs log [n]                   # last n telemetry frames
//
// Then point the device at the PROXY, not the target:
//   xcrun simctl openurl booted "http://localhost:8899/iframe.html?id=…"
//   swift sim-scroll.swift 0.8 0.25 60
//   xcrun simctl io booted screenshot shot.png    # captures Safari chrome too
//
// No dependencies. Node 18+ (uses global fetch).

import http from 'node:http'

const [, , cmd, ...rest] = process.argv
const argOf = (flag, dflt) => {
  const i = rest.indexOf(flag)
  return i >= 0 ? rest[i + 1] : dflt
}
const PORT = Number(process.env.SIM_BRIDGE_PORT || argOf('--port', 8899))
const BASE = `http://localhost:${PORT}`

// ---------------------------------------------------------------- agent ----
// Injected into every proxied HTML document. Runs in iOS Safari.
const AGENT = (hud) => `
<script>
(function () {
  if (window.__simAgent) return;
  window.__simAgent = true;
  var HUD = ${hud ? 'true' : 'false'};

  function px(v) {
    var d = document.createElement('div');
    d.style.cssText = 'position:absolute;top:0;left:0;width:1px;visibility:hidden;pointer-events:none;height:' + v;
    document.documentElement.appendChild(d);
    var h = parseFloat(getComputedStyle(d).height);
    d.remove();
    return h;
  }

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
      try { fetch('/__t', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p), keepalive: true }); } catch (e) {}
    }
  }
  setInterval(tick, 200);
  tick();

  // ---- command channel: long-poll for JS to eval, post the result back ----
  function poll() {
    fetch('/__cmd').then(function (r) { return r.status === 200 ? r.json() : null; })
      .then(function (c) {
        if (!c) return;
        var out, err = null;
        try { out = new Function(c.js)(); } catch (e) { err = String(e && e.stack || e); }
        return fetch('/__r', { method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id: c.id, result: out === undefined ? null : out, error: err }) });
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
    console.error('usage: node sim-bridge.mjs serve <targetOrigin> [--port 8899] [--hud 0]')
    process.exit(2)
  }
  const origin = new URL(target).origin
  const hud = argOf('--hud', '1') !== '0'

  const state = { latest: null, log: [], queue: [], results: new Map(), waiters: [] }

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
      const url = new URL(req.url, BASE)

      // --- local control endpoints (never proxied) ---
      if (url.pathname === '/__t') {
        const p = JSON.parse((await body(req)) || '{}')
        state.latest = p
        state.log.push(p)
        if (state.log.length > 500) state.log.shift()
        return json(res, 200, { ok: true })
      }
      if (url.pathname === '/__state') return json(res, 200, state.latest || {})
      if (url.pathname === '/__log') return json(res, 200, state.log.slice(-Number(url.searchParams.get('n') || 20))) // eslint-disable-line
      if (url.pathname === '/__push') {
        const { js } = JSON.parse((await body(req)) || '{}')
        const id = String(Math.random()).slice(2)
        state.queue.push({ id, js })
        // hold until the agent reports back (or times out)
        const started = Date.now()
        const wait = setInterval(() => {
          if (state.results.has(id)) {
            clearInterval(wait)
            const r = state.results.get(id)
            state.results.delete(id)
            json(res, 200, r)
          } else if (Date.now() - started > 15000) {
            clearInterval(wait)
            json(res, 504, { error: 'agent did not respond — is the page open in the Simulator?' })
          }
        }, 50)
        return
      }
      if (url.pathname === '/__cmd') {
        const next = state.queue.shift()
        if (next) return json(res, 200, next)
        // long-poll: hold ~5s so the agent isn't hammering
        const to = setTimeout(() => {
          const n2 = state.queue.shift()
          n2 ? json(res, 200, n2) : (res.writeHead(204), res.end())
        }, 5000)
        res.on('close', () => clearTimeout(to))
        return
      }
      if (url.pathname === '/__r') {
        const r = JSON.parse((await body(req)) || '{}')
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
          const tag = AGENT(hud)
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
    .listen(PORT, () => {
      console.log(`SIM_BRIDGE listening ${BASE} -> ${origin} (hud=${hud})`)
      console.log(`open on device: xcrun simctl openurl booted "${BASE}/"`)
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
  case 'eval': {
    const r = await fetch(BASE + '/__push', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ js: rest[0] }),
    })
    console.log(JSON.stringify(await r.json(), null, 1))
    break
  }
  default:
    console.error('usage: sim-bridge.mjs serve <origin> | probe | eval "<js>" | log [n]')
    process.exit(2)
}
