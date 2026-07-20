# The automation lock — why gestures and safaridriver can't coexist

## The trap

iOS shows a native modal — **"Safari is Running an Automated Test"** — whenever a
*user touch* lands on the screen while a WebDriver session is active. It is a
deliberate escape hatch so a human can reclaim a device from an automated run.

The problem: **iOS cannot tell a CGEvent drag from a real finger.** So
`sim-scroll.swift` — the skill's core technique for collapsing the toolbar —
raises the very alert that then blocks it.

Observed failure signature (this is exactly what it looks like):

```
SCROLL_DONE window=(114.0, 51.0, 698.0, 954.0) 810 -> 329 x=463   # helper reports success
{"touchEvents":0,"scrollY":0,"vvh":1280,"grew":0}                  # page saw nothing
```

The helper reports `SCROLL_DONE` because it posted the events successfully. It
has no idea they were eaten. The first drag is consumed raising the modal; every
drag after it lands on the modal, which is native UI sitting above the web view.

**Diagnostic rule:** a drag that reports `SCROLL_DONE` while `scrollY` stays `0`
*and* the page records zero `touchstart` events means the automation lock is up —
not a focus problem, not a permissions problem. Arm a touch listener before
concluding anything:

```js
window.__t = []
document.addEventListener('touchstart', () => window.__t.push(1), { passive: true })
```

## The three buttons — and which one not to guess at

| Button | Effect |
|---|---|
| **Turn Off Automation** | Disables Remote Automation entirely; `safaridriver --enable` needed again |
| **Stop Test Session** | Kills the WebDriver session → all later calls return `invalid session id` |
| **Continue Testing** | Dismisses, session survives — **the one you want** |

They are stacked vertically, "Continue Testing" **last**. The alert is centered.
A blind tap that lands one row high kills your session. This is not theoretical —
it is how the first investigation of this bug ended.

> **Correction to a long-standing gotcha:** this alert *does* respond to synthetic
> clicks. The old claim that "native Safari UI is unautomatable" is too broad —
> it holds for cert interstitials, but not here. What's unsafe is guessing
> coordinates, not clicking native UI.

## Recovering when the lock is already up

`xcrun simctl io booted screenshot` captures the **full device screen including
native UI** — unlike safaridriver screenshots, which are page-only and will show
you a perfectly normal page while the modal covers it. Screenshot first, read the
button positions off the image, convert to device points (`screenshot px / 2` at
2x), then `sim-tap.swift <deviceX> <deviceY>`.

`sim-tap.swift` takes **device points** (0–1024 × 0–1366 on an iPad Air 13"),
**not fractions**. Passing `0.5 0.635` silently taps the window's top-left corner.

## Mode selection — decide this before you boot

| | Mode A — safaridriver | Mode B — bridge |
|---|---|---|
| JS injection | ✅ `sim-session.mjs js` | ✅ `sim-bridge.mjs eval` |
| Geometry / viewport units | ✅ | ✅ |
| Page screenshot | ✅ page-only | ✅ via `simctl io` — **includes Safari chrome** |
| JS `.click()` | ✅ | ✅ |
| **CGEvent gestures / toolbar collapse** | ❌ **raises the lock** | ✅ |
| Setup cost | low | proxy must front the target |

**Rule: any task involving a real gesture — scrolling, toolbar collapse, momentum,
rubber-band, touch-focus — must use Mode B.** Mode A is for static measurement of
a page in its as-loaded state.

## Mode B: the bridge

No WebDriver session exists, so the lock can never appear. `sim-bridge.mjs`
reverse-proxies the target and injects an agent into every HTML response; the
agent posts telemetry out and long-polls for JS to eval.

```bash
# 1. front the target (Storybook, local harness, any http origin)
node ./scripts/sim-bridge.mjs serve http://localhost:6006 --port 8899 &

# 2. open via the PROXY — plain Safari, no automation session
xcrun simctl openurl booted "http://localhost:8899/iframe.html?id=components-dialog--sheet"

# 3. gesture for real — nothing intercepts it
swift ./scripts/sim-scroll.swift 0.8 0.25 60

# 4. measure
node ./scripts/sim-bridge.mjs probe                      # latest frame
node ./scripts/sim-bridge.mjs eval "return document.querySelector('#sheet').getBoundingClientRect().top"
node ./scripts/sim-bridge.mjs log 40                     # frame history across the gesture
xcrun simctl io booted screenshot shot.png               # HUD numbers + real toolbar state
```

The agent keeps a rolling log, so `log` gives you the viewport trace *through* the
scroll — the transient states a single screenshot cannot catch. It also paints a
HUD (`--hud 0` to disable) so `simctl` screenshots carry the numbers.

### Caveats

- The bridge strips `content-security-policy` from proxied responses so the
  injected agent can run. Never point it at anything but a dev/staging target.
- Everything is proxied same-origin through `localhost:<port>`, so relative URLs,
  fetches, and Storybook assets resolve normally. Absolute links to the target's
  own origin bypass the proxy and lose the agent.
- https targets behind a corporate ZTNA / self-signed cert are still walled — the
  cert interstitial is genuinely unautomatable (see SKILL.md gotchas).
- Paths beginning `/__` are reserved by the bridge.

> **Status: verified** on iPad Air 13" (M4), iOS 26.3 (2026-07-20). A CGEvent drag
> through the proxy scrolled the page `scrollY 0 → 1403` and collapsed the toolbar
> (`grew 0 → 29`, `dvh 1280 → 1309`) with **no** automation modal; `probe` and
> `eval` both returned live numbers. This is the scenario safaridriver cannot do.
