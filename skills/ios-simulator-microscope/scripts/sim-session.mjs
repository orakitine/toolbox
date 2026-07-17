#!/usr/bin/env node
// sim-session.mjs — persistent safaridriver WebDriver commander for a booted
// iOS Simulator. Holds ONE session across many CLI invocations by stashing the
// session id in a sidecar file, so an agent can drive Safari step by step.
//
// Prereq: `safaridriver -p 4444` running, and Simulator booted (`xcrun simctl
// boot <udid>`; `open -a Simulator`).
//
// Subcommands:
//   open <udid> <url>     create a session and navigate; saves session id
//   js '<script>'         run JS in the page, print return value as JSON
//   jsfile <path>         run JS read from a file (for long measurement scripts)
//   viewport              print a generic viewport-units + geometry readout
//   shot <path>           save a device screenshot (PNG) to <path>
//   nav <url>             navigate the existing session to <url>
//   close                 end the session
//
// Exit codes: 0 ok · 2 bad usage · 3 WebDriver/transport error.
// Env: SIM_DRIVER (default http://localhost:4444), SIM_SESSION_FILE
//      (default: a per-driver file in the OS temp dir, so invocations from
//      different working directories share the same session).

import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DRIVER = process.env.SIM_DRIVER ?? 'http://localhost:4444';
const SIDECAR = process.env.SIM_SESSION_FILE
  ?? join(tmpdir(), `sim-session-${DRIVER.replace(/[^\w]+/g, '_')}`);
const [cmd, ...rest] = process.argv.slice(2);

const HELP = `sim-session.mjs — persistent safaridriver WebDriver commander for a booted
iOS Simulator. Holds ONE session across many CLI invocations by stashing the
session id in a sidecar file, so an agent can drive Safari step by step.

Prereq: \`safaridriver -p 4444\` running, and Simulator booted (\`xcrun simctl
boot <udid>\`; \`open -a Simulator\`).

Subcommands:
  open <udid> <url>     create a session and navigate; saves session id
  js '<script>'         run JS in the page, print return value as JSON
  jsfile <path>         run JS read from a file (for long measurement scripts)
  viewport              print a generic viewport-units + geometry readout
  shot <path>           save a device screenshot (PNG) to <path>
  nav <url>             navigate the existing session to <url>
  close                 end the session

Exit codes: 0 ok · 2 bad usage · 3 WebDriver/transport error.
Env: SIM_DRIVER (default http://localhost:4444), SIM_SESSION_FILE
     (default: per-driver file in the OS temp dir).`;

if (!cmd || cmd === '--help' || cmd === '-h') {
  console.log(HELP);
  process.exit(cmd ? 0 : 2);
}

async function wd(method, path, body, timeoutMs = 180000) {
  let res;
  try {
    res = await fetch(`${DRIVER}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    console.error(`transport error: ${e.message}`);
    process.exit(3);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`${method} ${path} -> ${res.status}: ${JSON.stringify(json).slice(0, 400)}`);
    process.exit(3);
  }
  return json.value;
}

const sid = () => {
  if (!existsSync(SIDECAR)) {
    console.error(`no active session (${SIDECAR} missing) — run 'open <udid> <url>' first`);
    process.exit(2);
  }
  return readFileSync(SIDECAR, 'utf8').trim();
};
const S = (p) => `/session/${sid()}${p}`;
const runJs = (script, args = []) => wd('POST', S('/execute/sync'), { script, args });

// Generic viewport / dynamic-viewport-unit / scroll-lock readout. Element-
// specific measurements are the caller's job via `js` (see the diagnostic
// -decorator reference). Everything here is page-global.
const VIEWPORT_JS = `
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;left:0;width:1px;visibility:hidden;pointer-events:none';
  document.documentElement.appendChild(probe);
  const at = (h) => { probe.style.height = h; return Math.round(probe.getBoundingClientRect().height * 10) / 10; };
  const dvh = at('100dvh'), svh = at('100svh'), lvh = at('100lvh'), pct = at('100%');
  probe.remove();
  const vv = window.visualViewport;
  return {
    visualViewport: vv ? { height: vv.height, width: vv.width, offsetTop: vv.offsetTop, scale: vv.scale } : null,
    innerHeight: window.innerHeight,
    scrollY: Math.round(window.scrollY),
    units: { dvh, svh, lvh, pct_of_ICB: pct },
    // KEY: on the Simulator pct_of_ICB === dvh (100% tracks the dynamic
    // viewport). On real iPad hardware pct_of_ICB can stay pinned to svh after
    // the toolbar collapses — that mismatch is the stale-ICB bug class.
    screenHeight: window.screen.height,
    outerHeight: window.outerHeight,
    docClientHeight: document.documentElement.clientHeight,
    rootOverflow: getComputedStyle(document.documentElement).overflow,
    bodyOverflow: getComputedStyle(document.body).overflow,
  };
`;

switch (cmd) {
  case 'open': {
    const [udid, url] = rest;
    if (!udid || !url) { console.error('usage: open <udid> <url>'); process.exit(2); }
    const session = await wd('POST', '/session', {
      capabilities: { alwaysMatch: {
        browserName: 'Safari', platformName: 'iOS',
        'safari:useSimulator': true, 'safari:deviceUDID': udid,
      } },
    });
    writeFileSync(SIDECAR, session.sessionId);
    await wd('POST', `/session/${session.sessionId}/url`, { url });
    console.log(JSON.stringify({ session: session.sessionId, device: session.capabilities?.['safari:deviceName'], os: session.capabilities?.['safari:platformVersion'] }));
    break;
  }
  case 'nav': {
    if (!rest[0]) { console.error('usage: nav <url>'); process.exit(2); }
    await wd('POST', S('/url'), { url: rest[0] });
    console.log('ok');
    break;
  }
  case 'js':
    if (!rest[0]) { console.error("usage: js '<script>'"); process.exit(2); }
    console.log(JSON.stringify(await runJs(rest[0]), null, 2));
    break;
  case 'jsfile':
    if (!rest[0]) { console.error('usage: jsfile <path>'); process.exit(2); }
    console.log(JSON.stringify(await runJs(readFileSync(rest[0], 'utf8')), null, 2));
    break;
  case 'viewport':
    console.log(JSON.stringify(await runJs(VIEWPORT_JS), null, 2));
    break;
  case 'shot': {
    if (!rest[0]) { console.error('usage: shot <path.png>'); process.exit(2); }
    const b64 = await wd('GET', S('/screenshot'));
    writeFileSync(rest[0], Buffer.from(b64, 'base64'));
    console.log(rest[0]);
    break;
  }
  case 'close':
    await wd('DELETE', S(''));
    try { unlinkSync(SIDECAR); } catch {}
    console.log('closed');
    break;
  default:
    console.error(`unknown command: ${cmd} (try --help)`);
    process.exit(2);
}
