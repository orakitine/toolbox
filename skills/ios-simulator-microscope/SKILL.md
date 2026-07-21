---
name: ios-simulator-microscope
description: >-
  Reproduce and measure iOS-Safari-only layout, rendering, and interaction bugs
  on a booted iOS Simulator (iPad/iPhone) — the real-device counterpart to the
  desktop-Playwright browser-microscope. Drives Safari via safaridriver
  WebDriver + xcrun simctl to inject JS, read live geometry / computed styles /
  viewport units, and screenshot the device; uses macOS CGEvent drags to scroll
  and collapse the toolbar so dynamic-viewport dynamics appear. Use when a bug
  only shows in real iOS Safari and not in Playwright/Chromium/jsdom: dynamic
  viewport (dvh/svh/lvh) or stale initial-containing-block gaps, 100vh/100%
  sizing wrong after toolbar collapse, :focus-visible over-matching on
  programmatic or touch focus, momentum-scroll or rubber-band glitches,
  sticky/fixed drift, top-layer <dialog>/sheet coverage, safe-area insets, or
  any "works in Storybook but broken on iPad" report. Trigger phrases: "test on
  the iPad simulator", "reproduce this on iOS", "iOS Safari only bug", "check
  on real Safari".
license: MIT
compatibility: >-
  macOS with Xcode + iOS Simulator runtimes (xcrun simctl, safaridriver).
  Node.js >= 18 for the session and bridge scripts; Swift toolchain for the
  CGEvent helpers. Terminal needs Accessibility permission for scroll/tap.
allowed-tools:
  - Bash
  - Read
argument-hint: "[device] [url] [what to inspect]"
metadata:
  author: oleg
  version: "1.2"
---

# Purpose

Reproduce and measure layout, rendering, and interaction bugs that only manifest
in real iOS Safari — the ones desktop Playwright (`browser-microscope`), headless
WebKit, and jsdom are structurally blind to because they don't model the iOS
toolbar, dynamic viewport, or touch input. It boots a Simulator, drives Safari
through safaridriver, injects JS to read exact geometry and viewport-unit
resolution, screenshots the device, and scrolls via macOS CGEvent to trigger
toolbar-collapse dynamics — turning "looks wrong on my iPad" into measured
numbers.

## Prerequisites

All environmental preconditions are checked by `./scripts/preflight.sh` (workflow step 1) — macOS, Xcode + a Simulator runtime, safaridriver, Node.js >= 18, a Swift toolchain, and Accessibility permission for the terminal. The script only checks and instructs; the human-only setup actions it may ask for are:

- `safaridriver --enable` (one-time, prompts for auth).
- Granting the terminal **Accessibility** permission (System Settings → Privacy & Security → Accessibility; applies to new processes without a restart).
- Installing Xcode / an iOS Simulator runtime if absent.

## Variables

DRIVER_PORT: 4444          # Port for `safaridriver -p`; scripts read SIM_DRIVER=http://localhost:4444
BRIDGE_PORT: 8899          # Port for `sim-bridge.mjs serve` (Mode B); scripts read SIM_BRIDGE_PORT
DEVICE_MATCH: iPad Air 13  # Substring to pick the device from `simctl list` (match the bug report's device class)

## Pick a mode first

**safaridriver and CGEvent gestures are mutually exclusive.** A synthetic drag is
indistinguishable from a finger, so during a WebDriver session it raises the native
"Safari is Running an Automated Test" alert, which swallows that gesture and every
one after it. Choose before booting:

- **Mode A — safaridriver** (`sim-session.mjs`): static measurement of a page as
  loaded. JS injection, geometry, viewport units, page screenshots. **No gestures.**
- **Mode B — bridge** (`sim-bridge.mjs`): anything involving a real gesture —
  scrolling, toolbar collapse, momentum, rubber-band, touch focus. The bridge
  reverse-proxies the target and injects a measurement agent, so no WebDriver
  session exists and the lock never appears. Read `./references/automation-lock.md`.

If the task says "scroll", "collapse the toolbar", or "after scrolling" → Mode B.

## Workflow

1. **Confirm the environment**
   - Run the preflight doctor, then pick the target device.
   - Tool: `bash ./scripts/preflight.sh` — one PASS/FAIL line per check.
   - IF: `RESULT: FAIL` → relay each `fix:` remediation to the user verbatim and STOP; those checks (Xcode install, `safaridriver --enable`) are human-only actions. On non-macOS the script exits immediately: this skill is macOS-only.
   - IF: `RESULT: DEGRADED` (only `swift`/`accessibility` failed) → relay the fix lines, then CONTINUE: those gate only the CGEvent helpers (`sim-scroll.swift`, `sim-tap.swift`). Static measurement, the bridge, and programmatic scrolling (`sim-bridge.mjs eval "window.scrollBy(0,600)"`) all work without them — enough to trigger lazy-loading, scroll-position logic, and IntersectionObservers. Only true toolbar-collapse / momentum / rubber-band dynamics require the real gesture.
   - IF: all PASS → `xcrun simctl list devices available | grep -i "<DEVICE_MATCH>"` to get a UDID.
   - Example: report says "iPad Air 13-inch M2" → pick an `iPad Air 13-inch` UDID on the closest iOS runtime; if the bug is version-sensitive, note two UDIDs (e.g. one on iOS 18.x, one on 26.x).

2. **Boot the Simulator and driver**
   - Boot the device, open the Simulator GUI (needed — CGEvent scroll drives the visible window), start safaridriver.
   - Tool: `xcrun simctl boot <udid>`; `open -a Simulator`; `safaridriver -p <DRIVER_PORT> &` then `curl -s localhost:<DRIVER_PORT>/status`.
   - IF: Mode B → skip safaridriver entirely; an active WebDriver *session* is what raises the automation lock, and the bridge needs none.
   - Example: `{"value":{"ready":true}}` → driver is up. If a prior run left a session, `xcrun simctl terminate <udid> com.apple.mobilesafari` clears a stuck Safari pairing.

3. **Open the page and read the baseline**
   - Navigate and capture the untouched viewport state.
   - Tool (Mode A): `node ./scripts/sim-session.mjs open <udid> "<url>"` then `node ./scripts/sim-session.mjs viewport`.
   - Tool (Mode B): `node ./scripts/sim-bridge.mjs serve <targetOrigin> --port <BRIDGE_PORT> &`; `xcrun simctl openurl booted "http://localhost:<BRIDGE_PORT>/<path>"`; `node ./scripts/sim-bridge.mjs probe` for the baseline. Re-testing after a code change or a previous bridge run? Add `--fresh` — it mints a random port, i.e. a brand-new localhost origin Safari has never cached (see Gotchas).
   - IF: instrumentation must run before the page's own scripts (message taps, early hooks) → `serve … --init-js hooks.js` inlines that file right after the agent, ahead of all page code.
   - Example: local Storybook story `http://localhost:6006/iframe.html?...&id=...` → JSON showing `visualViewport.height`, `units.dvh/svh/lvh`, `units.pct_of_ICB`. For basic-auth staging, embed creds in the URL (`https://:pass@host/…`); a corporate ZTNA / self-signed cert shows a native "Not Private" interstitial that **cannot be automated** (see Gotchas).

4. **Reproduce the state, then measure**
   - Drive the interaction that triggers the bug, then screenshot + read geometry. Scrolling to collapse the toolbar is the usual trigger — and it requires **Mode B**.
   - Tool (Mode B): `swift ./scripts/sim-scroll.swift 0.8 0.25 60` to scroll down; then `node ./scripts/sim-bridge.mjs probe` (latest frame) / `eval "<js>"` (element geometry) / `console 50` (page console + JS errors) / `log 40` (frame history across the gesture).
   - **`eval` contract:** a bare expression returns its value (`eval "window.scrollY"` — auto-wrapped in `return (...)`); a multi-statement script runs as a function body and needs an explicit `return`, else the answer is `result: null` with a hint. Every answer carries `answeredBy` (the URL of the page that ran it) — **check it**: with more than one tab connected, evals go to whichever client polls first. `clients` lists connected pages; `eval "<js>" --match <url-substring>` pins the eval to one of them.
   - Screenshot with `xcrun simctl io booted screenshot out.png` then `Read out.png` — it captures **Safari's chrome**, so you can see whether the toolbar actually collapsed. `sim-session.mjs shot` is page-only and will hide both the toolbar state and any native modal.
   - IF: a drag prints `SCROLL_DONE` but `scrollY` stays 0 and the page logs no `touchstart` → the automation lock is up, not a focus/permission fault. Read `./references/automation-lock.md`.
   - IF: you need to observe a transient mid-interaction state (open a dialog exactly while the toolbar is collapsed) → inject the diagnostic decorator so screenshots carry the numbers, and auto-trigger on viewport GROWTH. Read `./references/diagnostic-decorator.md`. In Mode B the bridge's HUD and `log` already do this.
   - IF: you need to tap web content → dispatch a JS click (`.click()` via `sim-session.mjs js` or `sim-bridge.mjs eval`), NOT `sim-tap.swift` (see Gotchas).
   - Example: after scroll, `getBoundingClientRect()` on the offending element vs `visualViewport.height` → the gap in pixels, matching or refuting the report.

5. **Interpret against the hardware-only test**
   - Decide whether the Simulator can even show this bug before chasing it.
   - IF: `units.pct_of_ICB === units.dvh` after the toolbar collapses → the Simulator resolves `height:100%` to the dynamic viewport and **cannot reproduce stale-ICB gaps**; the bug is real-hardware-only. Stop, report that, and — if a fix changes `100%`→`100dvh` — note the sim can't distinguish fix from current (see Gotchas).
   - Example: measured `pct_of_ICB 1323 === dvh 1323` on collapse, no gap → declare hardware-only, hand the physical-device confirmation back to the user rather than grinding.

6. **Tear down**
   - Close cleanly so the next run isn't blocked by a stuck pairing.
   - Tool: `node ./scripts/sim-session.mjs close`; `pkill -f "safaridriver -p <DRIVER_PORT>"`; `pkill -f "sim-bridge.mjs serve"` if Mode B ran; optionally `xcrun simctl shutdown <udid>`.
   - Example: session closed → re-running step 2 later starts fresh. If `open` errors with "already paired", `xcrun simctl terminate <udid> com.apple.mobilesafari` and retry.

## References

### The automation lock, and gesture-capable Mode B

- IF: any gesture is involved (scroll, toolbar collapse, momentum, touch focus), or a drag reports `SCROLL_DONE` while the page doesn't move
- THEN: Read and apply `./references/automation-lock.md`
- EXAMPLES:
  - "scroll until the toolbar collapses, then measure the sheet"
  - "the drag says it worked but scrollY is still 0"
  - "a modal I can't see is blocking the Simulator"

### Painting measurements into device screenshots

- IF: you must observe a transient or animated state, or Web Inspector numbers won't land in a screenshot
- THEN: Read and apply `./references/diagnostic-decorator.md`
- EXAMPLES:
  - "capture the viewport numbers at the exact frame the sheet opens"
  - "the gap only exists mid-scroll, screenshot won't tell me the height"
  - "auto-open the dialog when the toolbar collapses"

## Gotchas

Environment facts learned the hard way — they defy reasonable assumptions:

- **A CGEvent gesture during a WebDriver session is silently eaten by the automation lock** — see *Pick a mode first* and `./references/automation-lock.md` for detail + recovery.
- **safaridriver interaction is broken on the Simulator.** WebDriver touch-pointer actions **hang** (request never returns); wheel actions return **501 not implemented**; discrete synthetic pointer clicks do **not** reliably convert to device touches. What works: `sim-scroll.swift` (CGEvent drag, Mode B only) for scrolling, and JS `.click()` dispatch for tapping web content.
- **`sim-tap.swift` takes DEVICE POINTS, not fractions.** `0..1024 × 0..1366` on an iPad Air 13". Passing `0.5 0.635` taps the window's top-left corner and looks like "native UI ignored my click". Read real coordinates off a `simctl io booted screenshot` (screenshot px ÷ 2 at 2x), and sanity-check the window mapping with `swift ./scripts/sim-window.swift`.
- **Native Safari UI is *partly* automatable — the distinction matters.** The automation-lock alert **does** respond to synthetic clicks (a mis-aimed tap on it will hit "Stop Test Session" and kill your session). Cert interstitials ("This Connection Is Not Private") genuinely do not. So a corporate **ZTNA / self-signed staging cert** still walls the sim even with correct basic-auth creds — you need a human tap or an enrolled device. Don't burn time scripting past *that* one.
- **safaridriver screenshots are page-only.** They show a normal-looking page while a native modal covers the screen, and never show the toolbar — so they cannot tell you whether it collapsed. Use `xcrun simctl io booted screenshot` whenever chrome or native UI matters.
- **The Simulator can't reproduce stale-ICB / dynamic-viewport bugs.** Its WebKit resolves `height:100%` to the *dynamic* viewport, so `pct_of_ICB === dvh` after the toolbar collapses and there is no gap. Real iPad hardware keeps `100%`/ICB pinned to the *small* viewport, which is the actual bug. Consequence: the sim can neither reproduce these nor distinguish a `100%`→`100dvh` fix from the status quo. Verify the fix is a no-op in the sim (zero regression) and hand real-device confirmation to the user. This is a *decision-saver* — check step 5 early.
- **CGEvent needs a focused Simulator and Accessibility permission.** `check-accessibility.swift` must print `true`; the scroll/tap helpers click the Simulator title bar to focus it first (`NSWorkspace.activate` is unreliable). If drags don't scroll, the window isn't frontmost or permission is missing.
- **Small-viewport height is version-specific.** iPad Air 13" reads ~1280 (iOS 26) vs ~1292 (iOS 18.4) with the toolbar shown. Auto-trigger logic must key off viewport **growth from a captured baseline**, never an absolute pixel threshold.
- **`open` fails with "already paired" after a crash.** Clear it with `xcrun simctl terminate <udid> com.apple.mobilesafari`, then retry — don't recreate the driver.
- **"Could not find any session hosts" hides two distinct causes.** (1) Remote automation not enabled — the simulator path reports it with this generic message, but a *host*-Safari probe names it: `curl -s -X POST localhost:<DRIVER_PORT>/session -H 'Content-Type: application/json' -d '{"capabilities":{"alwaysMatch":{"browserName":"Safari"}}}'`. An explicit "must enable 'Allow remote automation'" error → human runs `safaridriver --enable` (needs auth) or Safari → Settings → Developer → Allow remote automation. If the probe *succeeds*, DELETE its session, and the cause is (2): a runtime/Safari version gap — safaridriver won't pair with a much older simulator runtime (observed: safaridriver 26.x vs iOS 17.0 runtime). Fix: install a current iOS Simulator runtime (update Xcode, or `xcodebuild -downloadPlatform iOS` — multi-GB, ask the user first).
- **`xcode-select` pointing at CommandLineTools breaks simctl AND safaridriver — and only sudo truly fixes it.** If `xcode-select -p` prints `/Library/Developer/CommandLineTools` while `/Applications/Xcode.app` exists: `DEVELOPER_DIR=/Applications/Xcode.app` rescues `xcrun simctl`, but safaridriver **ignores it** when locating Simulator.app — session creation fails with "Could not find Simulator.app or a devices:// URL handler" (and `lsregister`/relaunching Simulator does not help). The only fix is the human running `sudo xcode-select -s /Applications/Xcode.app`, then restarting safaridriver.
- **Sim Safari's cache survives everything short of a new origin.** It serves stale HTML *and* stale JS chunks for a proxied localhost origin even across `simctl terminate` of Safari and cache-busting query strings — on hydrating apps this manifests as fresh server HTML silently "patched back" to old markup by stale-cached client JS (hydration mismatch), which reads exactly like your change didn't deploy. A new port is a new origin with an empty cache: re-serve with `--fresh` (or hand-pick an unused port) after every build you intend to verify.
- **Evals go to whichever connected page polls first.** Background tabs are suspended by iOS but wake unpredictably and can answer an eval meant for the foreground page — measurements then interleave across tabs and fabricate phantom effects (scroll positions jumping, wrong DOM). Always check `answeredBy` in the response; run `clients` when anything looks impossible; use `--match <url-substring>` to pin evals to one page; `simctl terminate booted com.apple.mobilesafari` + reopen to guarantee a single tab.
- **Reverse-proxying a child iframe's SPA origin usually kills the app.** Serving a second bridge for the iframe's origin injects the agent fine, but SPAs break under a swapped origin (base-href, absolute API URLs, service-worker scope) — the child may blank out, reload loops, or self-remove its own iframe. Parent-side message taps still work through it; just don't expect the child app to *function*. For looking *inside* a cross-origin iframe on desktop engines, plain Playwright reaches into OOPIFs natively (`page.frames()`) — exhaust that first, and burn a Simulator run only on the iOS-specific part.

## Works well with

Optional collaborators — this skill runs standalone and these degrade gracefully if absent.

- **`browser-microscope`** — the desktop-Playwright counterpart. Reproduce and measure there first (faster, no Simulator boot, reaches cross-origin iframes natively); escalate here only when the bug is iOS-Safari-only or involves toolbar/dynamic-viewport/touch dynamics Playwright can't model.
- **`diagnose`** — this skill is the reproduce-and-instrument step for iOS-Safari-only bug reports inside a disciplined diagnosis loop; measurements here become the evidence for its hypothesise/fix/regression-test phases.
