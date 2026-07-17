# The diagnostic-decorator technique

The Simulator's Web Inspector can attach to a page, but you can't screenshot the
Inspector cleanly and its measurements don't land in a device screenshot. The
trick: **paint the measurements INTO the page** as a fixed overlay, so every
`sim-session.mjs shot` doubles as a measurement readout. This is how you observe
viewport dynamics (toolbar collapse, dynamic-viewport units, element geometry)
that only exist on a real touch-driven scroll.

## Inject the overlay (any page)

Run this once via `sim-session.mjs js '<script>'` (single line, or use `jsfile`).
It appends a live readout and returns immediately; it keeps updating on a timer.

**Keep the leading `return`.** WebDriver's `execute/sync` treats the script as a
*function body*, so a bare IIFE evaluates but its value is discarded — you'd get
`null` back and can't tell "injected" from "failed". The `return` prefix makes
the `'injected'` / `'exists'` sentinels actually reach you.

```js
return (() => {
  if (document.getElementById('__mic')) return 'exists';
  const o = document.createElement('div');
  o.id = '__mic';
  o.style.cssText = 'position:fixed;top:0;left:0;z-index:2147483647;background:#fff;color:#000;font:700 18px/1.35 monospace;padding:10px 14px;border:3px solid #d00;white-space:pre;pointer-events:none';
  document.body.appendChild(o);
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;left:0;width:1px;visibility:hidden;pointer-events:none';
  document.body.appendChild(probe);
  const at = h => { probe.style.height = h; return Math.round(probe.getBoundingClientRect().height*10)/10; };
  // EDIT: selector for the element under investigation (a dialog, a focused
  // control, whatever). Leave null for viewport-only.
  const TARGET = 'dialog';
  setInterval(() => {
    const vv = window.visualViewport;
    // keep the readout painting above a top-layer <dialog> once it opens
    const host = document.querySelector('dialog[open]') || document.body;
    if (o.parentElement !== host) host.appendChild(o);
    const lines = [
      `vv ${vv ? Math.round(vv.height*10)/10 : '?'}  off ${vv ? vv.offsetTop : '?'}`,
      `dvh ${at('100dvh')}  svh ${at('100svh')}  lvh ${at('100lvh')}`,
      `100% ${at('100%')}   sy ${Math.round(scrollY)}`,
    ];
    const el = TARGET && document.querySelector(TARGET);
    if (el && vv) {
      const r = el.getBoundingClientRect();
      lines.push(`el h ${Math.round(r.height)} bot ${Math.round(r.bottom)}  GAP ${Math.round((vv.height - r.bottom)*10)/10}`);
    }
    o.textContent = lines.join('\n');
  }, 250);
  return 'injected';
})()
```

Then: `sim-scroll.swift` to collapse the toolbar → `sim-session.mjs shot out.png`
→ `Read out.png`. The red box shows the numbers at that frame.

## Auto-trigger on viewport GROWTH, not an absolute threshold

To catch a state that only exists mid-interaction (e.g. open a dialog exactly
when the toolbar is collapsed), trigger on **growth past the mounted baseline**,
because the small-viewport height differs per iOS version (1280 on iOS 26, 1292
on 18.4 for an iPad Air 13"). An absolute `> 1290` check fires on the wrong
version.

```js
const base = window.visualViewport.height;
const iv = setInterval(() => {
  if (window.visualViewport.height > base + 15) {   // toolbar collapsed
    clearInterval(iv);
    document.querySelector('#openBtn')?.click();     // capture the transient state
  }
}, 200);
```

## Storybook / embedded variant

If the page is your own Storybook (or any page you control), a temporary
decorator in `.storybook/preview.tsx` — or an inline `<script>` in the page —
gated on a URL flag (`?diag=1`) is cleaner than re-injecting after every
navigation — the overlay survives reloads. **Revert it before committing.**
The injected-JS form above needs no source change and is the default for
third-party pages.

On **iOS 26+ runtimes this embedded form is REQUIRED for scroll dynamics**:
Safari's automation guard blocks all CGEvent input while a WebDriver session is
open (see SKILL.md Gotchas), so the measurement run happens with no session at
all — `xcrun simctl openurl <udid> "<url>?diag=1"`, CGEvent scroll, then
`xcrun simctl io <udid> screenshot out.png`. The overlay in the screenshot is
your only readout; there is no `js` channel in this mode.
