---
name: browser-microscope
description: >-
  Real-browser DOM and layout microscope. Runs arbitrary JS in a live page,
  hit-tests why a click won't land (elementFromPoint — what element is covering
  it), dumps scroll and box geometry (scrollWidth, offsetLeft, overflow,
  scroll-padding), reads CSS custom-property design tokens via getComputedStyle,
  and sweeps viewport widths to find container-query / breakpoint thresholds.
  Use when a button does not respond to clicks, an element is mysteriously
  overlapped, covered, clipped or off-screen, scroll / snap geometry looks wrong,
  computed styles or tokens need reading live, z-index / stacking is suspect, or a
  layout bug only appears at certain widths. Drives the local Playwright npm
  package (no global CLI required) and supports HTTP basic-auth and self-signed
  staging certs. The layout-forensics complement to the journey-walking browser
  and browser-qa skills.
argument-hint: "[url] [what to inspect]"
allowed-tools:
  - Bash
  - Read
metadata:
  author: oleg
  version: "1.0"
---

# Purpose

Dissect a single frozen frame of a live web page to explain layout and
interaction bugs that jsdom and screenshots cannot — a click that does not
register, an element covered by an invisible overlay, wrong scroll/snap math,
a token that resolves to the wrong value, or a defect that only appears at
certain viewport widths. It drives the locally-installed Playwright package
through one bundled script and returns JSON, so findings are exact numbers, not
guesses. This is the introspection primitive; `browser` / `browser-qa` walk user
journeys, this one inspects the DOM truth at a moment in time.

## Prerequisites

- The `playwright` (or `playwright-core`) npm package must be resolvable from the
  target project — usually a devDep, so run commands from the project directory.
  Pass `--playwright <path>` to point elsewhere. The script exits with code 3 and
  a remediation hint if it cannot find it — it never hard-stops the way a global
  `playwright-cli` dependency would.

## Variables

PROBE: ./scripts/probe.mjs        # Bundled introspection engine (relative to skill root)
VIEWPORT: 1200x900                 # Default viewport WxH; cross a breakpoint by changing width
WAIT_MS: 1000                      # Settle delay after load before probing

## Workflow

1. **Run from the target project**
   - `cd` into the repo so the script resolves its `playwright` devDep, then call
     the bundled engine. Read `node <PROBE> --help` once if you need the full flag list.
   - IF: the page is behind staging basic-auth → add `--http-auth user:pass`
     (username may be blank: `--http-auth ":pass"`) and `--ignore-https-errors`.
   - Example: `cd ~/Documents/app && node <PROBE> eval --url https://stg.example.com --http-auth ":s3cret" --ignore-https-errors --js "document.title"`

2. **When a click does not register → `hit-test`**
   - The most common "button is broken" cause: another element covers it.
     `hit-test` does a real `elementFromPoint` at the element's center and reports
     whether the click lands on the target or what is on top.
   - IF: `lands: false` → the `covering` element (tag/class/outerHTML) is eating the
     click — inspect its `z-index`, `position`, or whether it is a stray overlay.
   - IF: `visible: false` (zero-size) → the control is `display:none` / collapsed,
     not covered — check container queries and parent layout instead.
   - Example: `node <PROBE> hit-test --url <url> --selector 'button[aria-label="Previous"]'`

3. **When geometry looks wrong → `box`**
   - Dumps `getBoundingClientRect` + `scrollLeft/scrollWidth/clientWidth/maxScrollLeft`
     + computed margins/padding/overflow/scroll-padding/transform for one element.
   - IF: `scroll.overflowsX` is true but `maxScrollLeft` is tiny → the rail barely
     overflows; index-based "next/prev" math can clamp short of a slide (a real
     class of carousel bug).
   - Example: `node <PROBE> box --url <url> --selector '#rail .viewport'`

4. **Find the REAL scroll container → `find-scroller`**
   - A `querySelector('[class*=viewport]')` can match a non-scrolling wrapper.
     `find-scroller` returns elements whose COMPUTED `overflowX` is `scroll`/`auto`,
     with their scroll metrics — use this to grab the actual scroller, then `box` it.
   - Example: `node <PROBE> find-scroller --url <url>`

5. **Read design tokens live → `tokens`**
   - Resolves CSS custom properties through `getComputedStyle`. Confirms a token
     (e.g. `--bleed-left`, `--theme-bg-default`) actually computes to what you expect.
   - IF: a specific token must be read → pass `--names '--a,--b'` (enumeration is
     best-effort; named reads are guaranteed). Default selector is `:root`.
   - Example: `node <PROBE> tokens --url <url> --selector '#card' --names '--bleed-left,--bleed-right'`

6. **When a bug only appears at some widths → `sweep`**
   - Loads at each `--widths` value and runs a per-width probe (`--selector` hit-test,
     or a custom `--js`), so you can see exactly what flips across a container-query /
     breakpoint threshold.
   - Example: `node <PROBE> sweep --url <url> --widths 600,768,1200 --js "(()=>{const vp=[...document.querySelectorAll('[class*=viewport]')].find(e=>getComputedStyle(e).overflowX==='scroll'); return vp?{max:vp.scrollWidth-vp.clientWidth}:'none';})()"`

7. **Run anything else → `eval`**
   - `--js '<expression>'` runs arbitrary JS in the page and returns its JSON result
     (multi-statement: wrap as an IIFE `"(()=>{...})()"`). This is the escape hatch
     for focus order, stacking context, computed values, ARIA state — anything.
   - Add `--console` to any command to capture page console errors alongside the result.
   - Example: `node <PROBE> eval --url <url> --js "getComputedStyle(document.activeElement).outlineWidth"`

## Gotchas

- **Programmatic `.click()` lies.** `element.click()` and Playwright's `locator.click()`
  on a forced node bypass hit-testing, so a covered button can look like it "works"
  in script while a real user's pointer is blocked. Trust `hit-test`
  (`elementFromPoint`), not a synthetic click, to decide whether a click truly lands.
- **The local Playwright package is CommonJS.** `import { chromium }` fails under ESM;
  the bundled script already handles this (default import then destructure) — keep that
  pattern if you hand-roll a one-off.
- **Class-substring selectors are treacherous** with hashed CS-module names
  (`_viewport_ab12` vs `_viewportWrapper_cd34` both match `[class*=viewport]`, and
  `querySelector` returns the first in document order — often the wrong one). Prefer
  `find-scroller` to grab the element by COMPUTED `overflowX`.

## References

### Worked diagnoses and advanced recipes

- IF: you want a full worked example (the Carousel "left button dead ≥692px" case),
  more `eval` snippets (focus order, stacking, container-query state), or screenshot
  capture for visual diffing
- THEN: Read `./reference/recipes.md`
- EXAMPLES:
  - "show me how this found the carousel bug"
  - "how do I check focus order / z-index stacking with this"
  - "capture a screenshot at a specific width"
