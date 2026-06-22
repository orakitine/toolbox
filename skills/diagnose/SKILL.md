---
name: diagnose
description: >-
  Disciplined diagnosis loop for hard bugs and performance regressions.
  Reproduce, minimise, hypothesise, instrument, fix, regression-test. Use when
  user says "diagnose this", "debug this", reports a bug, says something is
  broken / throwing / failing, or describes a performance regression. Triggers:
  "diagnose", "debug this", "why is X broken", "X is throwing", "X is failing",
  "perf regression", "this got slow", "intermittent failure", "flaky test".
---

# Purpose

A discipline for hard bugs — the ones that don't yield to a quick read of the stack trace. Forces a fast deterministic feedback loop first, then ranked falsifiable hypotheses, then targeted instrumentation, then a regression test that locks the fix in place. Skip phases only with explicit justification. The goal is not "the bug stopped happening" but "we know why it happened and we can prove it won't return."

When exploring the codebase during diagnosis, use the project's domain glossary to build a clear mental model of the relevant modules, and check ADRs in the area you're touching.

## Workflow

1. **Build a Feedback Loop**
   - **This is the skill.** Everything else is mechanical. If you have a fast, deterministic, agent-runnable pass/fail signal for the bug, you will find the cause — bisection, hypothesis-testing, and instrumentation all just consume that signal. If you don't have one, no amount of staring at code will save you.
   - Spend disproportionate effort here. Be aggressive. Be creative. Refuse to give up.
   - Try construction methods in roughly this order (stop at the first one that works):
     1. **Failing test** at whatever seam reaches the bug — unit, integration, e2e.
     2. **Curl / HTTP script** against a running dev server.
     3. **CLI invocation** with a fixture input, diffing stdout against a known-good snapshot.
     4. **Headless browser script** (Playwright / Puppeteer) — drives the UI, asserts on DOM/console/network.
     5. **Replay a captured trace.** Save a real network request / payload / event log to disk; replay it through the code path in isolation.
     6. **Throwaway harness.** Spin up a minimal subset of the system (one service, mocked deps) that exercises the bug code path with a single function call.
     7. **Property / fuzz loop.** If the bug is "sometimes wrong output", run 1000 random inputs and look for the failure mode.
     8. **Bisection harness.** If the bug appeared between two known states (commit, dataset, version), automate "boot at state X, check, repeat" so you can `git bisect run` it.
     9. **Differential loop.** Run the same input through old-version vs new-version (or two configs) and diff outputs.
     10. **HITL bash script.** Last resort. If a human must click, drive *them* with `./scripts/hitl-loop.template.sh` so the loop is still structured. Captured output feeds back to you.
   - Build the right feedback loop, and the bug is 90% fixed.
   - Example: User reports "the Export button sometimes throws" → start with a failing Playwright test that clicks Export 20× and asserts no console errors. If the bug is too deep in the stack for the UI to reach reliably, drop to a Node harness that calls the export function directly with a captured payload.
   - Example: "API returns 500 under load" → curl loop hammering the endpoint 100×, asserting status==200, capturing the first failing response body.
   - IF: bug only reproduces in production environment → see step 1c (cannot build a loop).

1a. **Iterate on the Loop Itself**
   - Treat the loop as a product. Once you have *a* loop, sharpen it:
     - Can I make it faster? Cache setup, skip unrelated init, narrow the test scope.
     - Can I make the signal sharper? Assert on the specific symptom, not "didn't crash".
     - Can I make it more deterministic? Pin time, seed RNG, isolate filesystem, freeze network.
   - A 30-second flaky loop is barely better than no loop. A 2-second deterministic loop is a debugging superpower.
   - Example: First-pass loop boots the whole app (45s) and clicks through 5 screens to trigger the bug. Refine: bypass auth with a session token fixture, deep-link straight to the broken screen, replay the captured XHR. New loop: 3s.

1b. **Handle Non-Deterministic Bugs**
   - IF: bug only reproduces sometimes → the goal is not a clean repro but a **higher reproduction rate**.
   - THEN: loop the trigger 100×, parallelise, add stress, narrow timing windows, inject sleeps. A 50%-flake bug is debuggable; 1% is not — keep raising the rate until it's debuggable.
   - Example: "Race condition in cache write, fails ~2% of the time" → wrap the trigger in a 200-iteration loop with concurrent workers; failure rate jumps to ~40%; now you can hypothesise.

1c. **When You Genuinely Cannot Build a Loop**
   - Stop and say so explicitly. Do **not** proceed to hypothesise without a loop.
   - List what you tried.
   - Ask the user for one of:
     - (a) access to whatever environment reproduces it
     - (b) a captured artifact (HAR file, log dump, core dump, screen recording with timestamps)
     - (c) permission to add temporary production instrumentation
   - Example: "I can't reproduce locally — the bug needs the prod payment provider sandbox. Options: give me sandbox creds, share a HAR from a failing session, or approve temporary structured logging around `chargeCard()` for 24h."
   - Do not proceed to step 2 until you have a loop you believe in.

2. **Reproduce**
   - Run the loop. Watch the bug appear.
   - Confirm:
     - The loop produces the failure mode the **user** described — not a different failure that happens to be nearby. Wrong bug = wrong fix.
     - The failure is reproducible across multiple runs (or, for non-deterministic bugs, reproducible at a high enough rate to debug against).
     - You have captured the exact symptom (error message, wrong output, slow timing) so later phases can verify the fix actually addresses it.
   - Example: User said "Export throws TypeError". Your loop throws a `RangeError` from a different code path. STOP — that's a different bug. Adjust the loop or ask the user to clarify which symptom is the real one.
   - IF: loop produces a different symptom than reported → narrow the loop or re-confirm the symptom with the user before proceeding.
   - Do not proceed until you reproduce the bug the user actually reported.

3. **Hypothesise**
   - Generate **3–5 ranked hypotheses** before testing any of them. Single-hypothesis generation anchors on the first plausible idea.
   - Each hypothesis must be **falsifiable**: state the prediction it makes.
   - Format: "If `<X>` is the cause, then `<changing Y>` will make the bug disappear / `<changing Z>` will make it worse."
   - IF: you cannot state the prediction → the hypothesis is a vibe. Discard or sharpen it.
   - **Show the ranked list to the user before testing.** They often have domain knowledge that re-ranks instantly ("we just deployed a change to #3"), or know hypotheses they've already ruled out. Cheap checkpoint, big time saver. Don't block on it — proceed with your ranking if the user is AFK.
   - Example: Export throws `TypeError: cannot read 'length' of undefined`. Ranked hypotheses:
     1. `exportItems` is empty when called from the keyboard-shortcut path → predict: triggering Export from the menu (which preloads items) will not throw.
     2. New row format from yesterday's migration has a nullable `tags` field that the formatter assumes is an array → predict: rows created before the migration export fine; rows created after throw.
     3. Race: items are still loading when Export fires after a quick page switch → predict: forcing a 500ms delay before clicking Export removes the bug.

4. **Instrument**
   - Each probe must map to a specific prediction from step 3. **Change one variable at a time.**
   - Tool preference (top to bottom):
     1. **Debugger / REPL inspection** if the env supports it. One breakpoint beats ten logs.
     2. **Targeted logs** at the boundaries that distinguish hypotheses.
     3. Never "log everything and grep".
   - **Tag every debug log** with a unique prefix, e.g. `[DEBUG-a4f2]`. Cleanup at the end becomes a single grep. Untagged logs survive; tagged logs die.
   - Example: Testing hypothesis #2 (nullable `tags`) → add `console.log('[DEBUG-a4f2] tags:', row.id, row.tags)` immediately before the formatter call. Run the loop. Output shows `tags: undefined` for exactly the rows that fail. Hypothesis confirmed.
   - **Perf branch.** IF: this is a performance regression, not a correctness bug → logs are usually wrong. THEN: establish a baseline measurement (timing harness, `performance.now()`, profiler, query plan), then bisect. Measure first, fix second.
   - Example (perf): "Dashboard got 4× slower" → wrap the suspect block in `performance.now()` deltas, log to CSV, run against the loop, then bisect by `git checkout` between the last-known-fast commit and HEAD until the regression bisects to a single commit.

5. **Fix and Regression Test**
   - Write the regression test **before the fix** — but only if there is a **correct seam** for it.
   - A correct seam is one where the test exercises the **real bug pattern** as it occurs at the call site. If the only available seam is too shallow (single-caller test when the bug needs multiple callers, unit test that can't replicate the chain that triggered the bug), a regression test there gives false confidence.
   - IF: no correct seam exists → that itself is the finding. Note it. The codebase architecture is preventing the bug from being locked down. Flag this for step 6.
   - IF: a correct seam exists → follow this sequence:
     1. Turn the minimised repro into a failing test at that seam.
     2. Watch it fail.
     3. Apply the fix.
     4. Watch it pass.
     5. Re-run the step 1 feedback loop against the original (un-minimised) scenario.
   - Example: Bug confirmed as null `tags`. Correct seam = the formatter, called by both Export and PDF print. Write a unit test on the formatter with a row whose `tags` is `null`. Test fails. Patch formatter to coalesce to `[]`. Test passes. Run the full Export loop — green.
   - Example (no seam): Bug only manifests when three callers race. The only existing test seam is a single-caller unit test that can't reproduce the race. Note: "No correct regression seam exists. Architectural change needed to make this lockdownable. See step 6."

6. **Cleanup and Post-Mortem**
   - Required before declaring done:
     - Original repro no longer reproduces (re-run the step 1 loop).
     - Regression test passes (or absence of seam is documented).
     - All `[DEBUG-...]` instrumentation removed (`grep` the prefix to confirm).
     - Throwaway prototypes deleted (or moved to a clearly-marked debug location).
     - The hypothesis that turned out correct is stated in the commit / PR message — so the next debugger learns.
   - Example commit message: "Fix Export crash on rows with null tags. Root cause: yesterday's migration made `tags` nullable but the formatter assumed array. Coalesce to `[]` in the formatter. Regression test added at the formatter seam."
   - **Then ask: what would have prevented this bug?**
   - IF: the answer involves architectural change (no good test seam, tangled callers, hidden coupling) → hand off to a codebase-architecture skill / next-step recommendation with the specifics.
   - Make the recommendation **after** the fix is in, not before — you have more information now than when you started.
   - Example: "Fix landed. Prevention recommendation: the formatter is called from 6 different sites with different row shapes. Consider a single `normalizeRow()` step at ingestion so downstream code doesn't have to defend against schema drift. Filing as a follow-up."

## Works well with

Optional collaborators — `diagnose` runs standalone and these degrade gracefully if absent.

- **`grill-me`** — when the bug report is vague, grill first to nail the real failure mode before building the diagnosis loop.
- **`tdd`** — once the root cause is found, capture it as a failing test and drive the fix red-green so the regression can't return.
