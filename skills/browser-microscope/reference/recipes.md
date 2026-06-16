# Recipes — worked diagnoses & advanced probes

Concrete patterns for `./scripts/probe.mjs`. Run from the target project so
`playwright` resolves. All commands print JSON on stdout.

## Worked case: "button dead at ≥692px, works below" (a real carousel bug)

Symptom: a carousel's Previous button does nothing on wide viewports but works
when narrow. The instinct is "something covers it." The microscope disproved that
and found the real cause — clamped scroll math — in four steps.

1. **Is it covered, or collapsed?**
   ```bash
   node ./scripts/probe.mjs hit-test --url <url> --http-auth ":pass" --ignore-https-errors \
     --selector 'button[aria-label="Previous"]'
   ```
   `lands: true` ruled out an overlay. `visible: false` would have meant
   `display:none` (a container-query / breakpoint issue) instead.

2. **Grab the real scroller, not a wrapper.**
   ```bash
   node ./scripts/probe.mjs find-scroller --url <url> --http-auth ":pass" --ignore-https-errors
   ```
   A class-substring guess matched the non-scrolling `viewportWrapper`; this
   surfaced the element whose computed `overflowX` is `scroll`.

3. **Dump its geometry.**
   ```bash
   node ./scripts/probe.mjs box --url <url> --http-auth ":pass" --ignore-https-errors \
     --selector '<real-scroller-selector>'
   ```
   `scrollWidth 1187 / clientWidth 1120 → maxScrollLeft 67`. The rail barely
   overflowed: the slides nearly fit, so the last "next" clamps to 67px — short of
   the next slide's offset. Index-based prev/next math then resolves the active
   slide as 0 and computes `slides[-1]`, leaving the enabled button a no-op.

4. **Confirm the threshold.**
   ```bash
   node ./scripts/probe.mjs sweep --url <url> --http-auth ":pass" --ignore-https-errors \
     --widths 600,1200 \
     --js "(()=>{const vp=[...document.querySelectorAll('[class*=viewport]')].find(e=>getComputedStyle(e).overflowX==='scroll'); return vp?{max:vp.scrollWidth-vp.clientWidth}:'none';})()"
   ```
   Tiny `max` at the wide width, generous at the narrow width → the bug tracks the
   amount of overflow, not the controls' placement. Red herrings (inline controls,
   bleed) eliminated.

The fix lived in the navigation math, not CSS — but the microscope is what pointed
there instead of at a phantom overlay.

## Advanced `eval` snippets

`eval --js` runs arbitrary JS and returns JSON. Wrap multi-statement logic as an
IIFE. Useful probes:

- **What is covering an arbitrary point** (not just an element center):
  ```bash
  --js "(()=>{const h=document.elementFromPoint(120,88); return {tag:h.tagName, class:String(h.className), z:getComputedStyle(h).zIndex};})()"
  ```
- **Focus order / current focus** (a11y):
  ```bash
  --js "(()=>{const a=document.activeElement; return {tag:a.tagName, label:a.getAttribute('aria-label'), text:a.textContent?.slice(0,40)};})()"
  ```
- **Stacking context audit** — find positioned elements with a z-index:
  ```bash
  --js "[...document.querySelectorAll('*')].filter(e=>{const c=getComputedStyle(e); return c.zIndex!=='auto' && c.position!=='static';}).slice(0,20).map(e=>({tag:e.tagName, class:String(e.className).slice(0,40), z:getComputedStyle(e).zIndex, pos:getComputedStyle(e).position}))"
  ```
- **Container-query / breakpoint state** — read a value that flips at a threshold,
  then run it inside `sweep --js` across candidate widths to bisect the breakpoint.
- **Is an element actually in the viewport** (clipped/off-screen):
  ```bash
  --js "(()=>{const r=document.querySelector('SEL').getBoundingClientRect(); return {inView: r.top>=0 && r.left>=0 && r.bottom<=innerHeight && r.right<=innerWidth, r:{t:r.top,l:r.left,b:r.bottom,rt:r.right}};})()"
  ```

## Screenshots for visual diffing

```bash
node ./scripts/probe.mjs screenshot --url <url> --viewport 768x900 --out ./before.png
```
Pair with `--wait-selector` to ensure the component has rendered, and capture at
several `--viewport` widths to eyeball a responsive break before reaching for the
numeric probes.

## WebKit vs Chromium

Layout/compositor bugs sometimes only reproduce in one engine. Re-run any command
with `--browser webkit` (or `firefox`) to compare — the same flags apply.
