# diagnose

A discipline for hard bugs and performance regressions. Forces a fast deterministic feedback loop first, then ranked falsifiable hypotheses, targeted instrumentation, and a regression test that locks the fix in place.

## Quick start

Trigger any of:

- `diagnose this`
- `debug this`
- "X is broken / throwing / failing"
- "performance regression"
- "intermittent failure" / "flaky test"

The skill walks the 6-phase loop: build feedback loop, reproduce, hypothesise, instrument, fix + regression test, cleanup + post-mortem. Skip phases only with explicit justification.

## When to use it

Reach for `diagnose` when the bug doesn't yield to a quick stack-trace read. It earns its keep on:

- Intermittent / flaky failures
- Performance regressions
- Multi-step user-reported bugs you can't immediately reproduce
- "It works on my machine" classes of bug

For obvious one-line fixes, skip the ceremony.

## What's bundled

- `SKILL.md` — the 6-phase workflow
- `scripts/hitl-loop.template.sh` — last-resort human-in-the-loop reproduction harness. Copy, edit the `step` / `capture` calls, and run it when only a human can drive the UI.

## Examples

| Symptom | First-pass loop |
|---|---|
| "Export button sometimes throws" | Playwright test clicking Export 20× asserting no console errors |
| "API returns 500 under load" | curl loop hammering endpoint 100× capturing first failing response body |
| "Dashboard got 4× slower" | Timing harness with `performance.now()` deltas, bisect commits |
| "Race condition fails 2% of the time" | 200-iteration loop with concurrent workers to raise the rate |

## Attribution

Adapted from [mattpocock/skills](https://github.com/mattpocock/skills). See `_attribution.md`.

## Related

- `quality-gate` — lint/types/tests/build verification. Run after a diagnose-driven fix.
- `browser` — Playwright-based feedback loop for UI bugs (see step 1, method #4).
