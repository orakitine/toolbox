#!/usr/bin/env node
/**
 * probe.mjs — a real-browser DOM/layout microscope.
 *
 * Drives the locally-installed `playwright` npm package (no global CLI needed)
 * to introspect a live page: run arbitrary JS, hit-test elements, dump scroll
 * geometry, read CSS custom-property tokens, and sweep viewport widths to find
 * container-query / breakpoint thresholds.
 *
 * Output: a single JSON object/array on stdout. Diagnostics on stderr.
 * Exit codes: 0 ok · 1 usage error · 2 navigation/timeout · 3 playwright missing.
 *
 * See `node probe.mjs --help` for commands and flags.
 */
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

// ── playwright resolution ────────────────────────────────────────────────────
// The local package is CommonJS — `import { chromium }` fails under ESM, so we
// resolve it through createRequire and destructure the default export. Resolve
// from the TARGET project's cwd first (where playwright is usually a devDep),
// then from this script's own location, then a bare require as a last resort.
function loadPlaywright(explicitPath) {
  const candidates = [];
  if (explicitPath) candidates.push(explicitPath);
  const fromCwd = createRequire(path.join(process.cwd(), 'noop.js'));
  const fromHere = createRequire(import.meta.url);
  for (const [req, name] of [
    [fromCwd, 'playwright'],
    [fromCwd, 'playwright-core'],
    [fromHere, 'playwright'],
    [fromHere, 'playwright-core'],
  ]) {
    candidates.push({ req, name });
  }
  for (const c of candidates) {
    try {
      if (typeof c === 'string') {
        const mod = createRequire(import.meta.url)(c);
        return mod.chromium ? mod : mod.default ?? mod;
      }
      const mod = c.req(c.name);
      if (mod && (mod.chromium || mod.default?.chromium)) {
        return mod.chromium ? mod : mod.default;
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

// ── arg parsing ──────────────────────────────────────────────────────────────
// Flags that never take a value. Everything else consumes the NEXT token as its
// value — even when that value starts with `--` (CSS custom-property names like
// `--bleed-left` do, and `tokens --names '--a,--b'` must work). The `--key=value`
// form is also supported.
const BOOLEAN_FLAGS = new Set(['ignore-https-errors', 'headed', 'console', 'help']);

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const opts = {};
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (!a.startsWith('--')) continue;
    const body = a.slice(2);
    const eq = body.indexOf('=');
    if (eq !== -1) {
      opts[body.slice(0, eq)] = body.slice(eq + 1);
      continue;
    }
    if (BOOLEAN_FLAGS.has(body)) {
      opts[body] = true;
      continue;
    }
    const next = rest[i + 1];
    if (next === undefined) {
      opts[body] = true;
    } else {
      opts[body] = next;
      i++;
    }
  }
  return { command, opts };
}

const HELP = `browser-microscope probe — real-browser DOM/layout introspection

USAGE
  node probe.mjs <command> --url <url> [options]

COMMANDS
  eval          Run arbitrary JS in the page, return its JSON result.
                --js '<expression>'   e.g. --js "document.title"
                                      multi-statement: --js "(()=>{...})()"
  hit-test      Does a click at the element's center land ON it, or what covers it?
                --selector '<css>'
  box           Geometry: getBoundingClientRect + scroll metrics + computed box.
                --selector '<css>'
  tokens        Read CSS custom properties (design tokens) live.
                --selector '<css>'   (default: ':root')
                --names '--a,--b'    (default: best-effort enumerate all --*)
  find-scroller Find the REAL scroll containers (computed overflowX scroll/auto),
                not just a class match. No selector needed.
  sweep         Load at several widths; report what changes across the threshold.
                --widths 600,768,1200   --selector '<css>' (probed per width)
                or --js '<expression>'  (run per width instead)
  screenshot    Save a PNG of the current viewport.
                --out <path>          (default: ./microscope.png)

COMMON OPTIONS
  --url <url>              Page to open (required for all commands).
  --http-auth user:pass    HTTP basic auth (username may be blank: ":pass").
  --ignore-https-errors    Accept self-signed / staging certs.
  --viewport WxH           Viewport size. Default 1200x900.
  --browser <name>         chromium | webkit | firefox. Default chromium.
  --headed                 Show the browser window (default headless).
  --wait <ms>              Settle delay after load. Default 1000.
  --wait-selector <css>    Wait for this selector before probing.
  --console                Include captured console errors in the output.
  --playwright <path>      Explicit path/name to resolve playwright from.

NOTES
  - Output is JSON on stdout; pipe to jq if you like.
  - hit-test uses elementFromPoint — a real pointer test. Note that a
    programmatic element.click() BYPASSES hit-testing and can falsely "work"
    while a real user click is blocked by a covering element.`;

// ── in-page probe functions (serialized into the browser) ────────────────────
const PROBES = {
  hitTest: (sel) => {
    const el = document.querySelector(sel);
    if (!el) return { selector: sel, error: 'selector not found' };
    const r = el.getBoundingClientRect();
    const rect = {
      x: Math.round(r.x), y: Math.round(r.y),
      w: Math.round(r.width), h: Math.round(r.height),
    };
    if (r.width === 0 || r.height === 0)
      return { selector: sel, visible: false, rect, lands: false, note: 'zero-size / display:none' };
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const hit = document.elementFromPoint(cx, cy);
    const lands = hit === el || el.contains(hit);
    return {
      selector: sel, visible: true, rect, center: { cx: Math.round(cx), cy: Math.round(cy) },
      lands,
      covering: lands ? null : {
        tag: hit?.tagName?.toLowerCase(),
        class: typeof hit?.className === 'string' ? hit.className : String(hit?.className ?? ''),
        id: hit?.id || undefined,
        outerHTML: hit?.outerHTML?.slice(0, 200),
      },
    };
  },
  box: (sel) => {
    const el = document.querySelector(sel);
    if (!el) return { selector: sel, error: 'selector not found' };
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      selector: sel,
      rect: {
        x: Math.round(r.x), y: Math.round(r.y),
        w: Math.round(r.width), h: Math.round(r.height),
      },
      scroll: {
        scrollLeft: el.scrollLeft, scrollTop: el.scrollTop,
        scrollWidth: el.scrollWidth, scrollHeight: el.scrollHeight,
        clientWidth: el.clientWidth, clientHeight: el.clientHeight,
        maxScrollLeft: el.scrollWidth - el.clientWidth,
        overflowsX: el.scrollWidth > el.clientWidth,
      },
      style: {
        display: cs.display, position: cs.position, zIndex: cs.zIndex,
        overflow: cs.overflow, overflowX: cs.overflowX, overflowY: cs.overflowY,
        marginLeft: cs.marginLeft, marginRight: cs.marginRight,
        paddingLeft: cs.paddingLeft, paddingRight: cs.paddingRight,
        scrollPaddingLeft: cs.scrollPaddingLeft,
        transform: cs.transform === 'none' ? 'none' : cs.transform,
      },
    };
  },
  tokens: (payload) => {
    const { sel, names } = payload;
    const el = document.querySelector(sel);
    if (!el) return { selector: sel, error: 'selector not found' };
    const cs = getComputedStyle(el);
    const out = {};
    if (names && names.length) {
      for (const n of names) out[n] = cs.getPropertyValue(n).trim();
      return { selector: sel, tokens: out };
    }
    // Best-effort enumerate. Registered/inherited custom props show up in the
    // computed style index in most engines; unregistered ones may not — pass
    // --names for guaranteed reads.
    for (let i = 0; i < cs.length; i++) {
      const prop = cs[i];
      if (prop.startsWith('--')) out[prop] = cs.getPropertyValue(prop).trim();
    }
    return { selector: sel, tokens: out, note: 'best-effort; pass --names for guaranteed reads' };
  },
  findScroller: () => {
    return [...document.querySelectorAll('*')]
      .filter((e) => {
        const o = getComputedStyle(e).overflowX;
        return o === 'scroll' || o === 'auto';
      })
      .slice(0, 30)
      .map((e) => ({
        tag: e.tagName.toLowerCase(),
        class: typeof e.className === 'string' ? e.className.slice(0, 80) : '',
        overflowX: getComputedStyle(e).overflowX,
        scrollWidth: e.scrollWidth,
        clientWidth: e.clientWidth,
        overflows: e.scrollWidth > e.clientWidth,
      }));
  },
};

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h') {
    console.log(HELP);
    process.exit(argv.length === 0 ? 1 : 0);
  }
  const { command, opts } = parseArgs(argv);

  const valid = ['eval', 'hit-test', 'box', 'tokens', 'find-scroller', 'sweep', 'screenshot'];
  if (!valid.includes(command)) {
    console.error(`Unknown command: ${command}\n${HELP}`);
    process.exit(1);
  }
  if (!opts.url) {
    console.error('Missing --url\n');
    console.error(HELP);
    process.exit(1);
  }

  const pw = loadPlaywright(typeof opts.playwright === 'string' ? opts.playwright : null);
  if (!pw) {
    console.error(
      JSON.stringify({
        error: 'playwright not found',
        hint: 'Install it in the target project (`npm i -D playwright`) or pass --playwright <path>. ' +
          'This skill intentionally uses the node package, not a global playwright-cli.',
      })
    );
    process.exit(3);
  }

  const browserName = typeof opts.browser === 'string' ? opts.browser : 'chromium';
  const engine = pw[browserName] || pw.chromium;
  const [vw, vh] = (typeof opts.viewport === 'string' ? opts.viewport : '1200x900')
    .split('x').map((n) => parseInt(n, 10));
  const auth = typeof opts['http-auth'] === 'string'
    ? { username: opts['http-auth'].split(':')[0], password: opts['http-auth'].split(':').slice(1).join(':') }
    : undefined;
  const wait = parseInt(typeof opts.wait === 'string' ? opts.wait : '1000', 10);

  const browser = await engine.launch({ headless: !opts.headed });
  const consoleErrors = [];
  let exitCode = 0;
  try {
    const context = await browser.newContext({
      viewport: { width: vw || 1200, height: vh || 900 },
      httpCredentials: auth,
      ignoreHTTPSErrors: !!opts['ignore-https-errors'],
    });
    const page = await context.newPage();
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200));
    });

    const goto = async () => {
      await page.goto(opts.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      if (typeof opts['wait-selector'] === 'string') {
        await page.waitForSelector(opts['wait-selector'], { timeout: 15000 }).catch(() => {});
      }
      if (wait) await page.waitForTimeout(wait);
    };

    let result;
    if (command === 'sweep') {
      const widths = (typeof opts.widths === 'string' ? opts.widths : '600,768,1200')
        .split(',').map((n) => parseInt(n.trim(), 10)).filter(Boolean);
      result = [];
      for (const w of widths) {
        await page.setViewportSize({ width: w, height: vh || 900 });
        await goto();
        let frame;
        if (typeof opts.js === 'string') frame = await page.evaluate(opts.js);
        else if (typeof opts.selector === 'string')
          frame = await page.evaluate(PROBES.hitTest, opts.selector);
        else frame = await page.evaluate(PROBES.findScroller);
        result.push({ width: w, result: frame });
      }
    } else {
      await goto();
      switch (command) {
        case 'eval':
          if (typeof opts.js !== 'string') { console.error('eval needs --js'); exitCode = 1; break; }
          result = await page.evaluate(opts.js);
          break;
        case 'hit-test':
          result = await page.evaluate(PROBES.hitTest, requireSelector(opts));
          break;
        case 'box':
          result = await page.evaluate(PROBES.box, requireSelector(opts));
          break;
        case 'tokens': {
          const names = typeof opts.names === 'string'
            ? opts.names.split(',').map((s) => s.trim()).filter(Boolean) : null;
          result = await page.evaluate(PROBES.tokens, {
            sel: typeof opts.selector === 'string' ? opts.selector : ':root',
            names,
          });
          break;
        }
        case 'find-scroller':
          result = await page.evaluate(PROBES.findScroller);
          break;
        case 'screenshot': {
          const out = typeof opts.out === 'string' ? opts.out : './microscope.png';
          await page.screenshot({ path: out });
          result = { screenshot: out };
          break;
        }
      }
    }

    const payload = opts.console ? { result, consoleErrors } : result;
    process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    exitCode = exitCode || 2;
  } finally {
    await browser.close();
  }
  process.exit(exitCode);
}

function requireSelector(opts) {
  if (typeof opts.selector !== 'string') {
    console.error('This command needs --selector');
    process.exit(1);
  }
  return opts.selector;
}

main();
