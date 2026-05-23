# Skills Playbook

How to get real value out of the engineering and productivity skills adopted from Matt Pocock's collection. The skills are small and composable on purpose — this doc shows how they fit together.

## The mental model: four failure modes

Pocock built his skills around four failure modes that show up when working with coding agents. Each mode has dedicated skills that target it.

| Failure mode | Symptom | Skills that target it |
|---|---|---|
| **Misalignment** | Agent built the wrong thing | `grill-me`, `grill-with-docs` |
| **Verbosity** | 20 words where 1 will do; project terms diluted into generic CS | `grill-with-docs` (via `CONTEXT.md`), `caveman` |
| **Broken code** | Code compiles but doesn't actually work | `tdd`, `diagnose` |
| **Ball of mud** | Codebase entropy outpaces human review | `improve-codebase-architecture`, `zoom-out` |

Two productivity skills sit alongside: `handoff` (compact a conversation for the next session) and `caveman` (token-diet mode).

## Composable workflows

These are recipes — chains of skills for common situations.

### Starting a new feature

```
/grill-with-docs         # align on scope, sharpen language, capture ADRs
  ↓
/tdd                     # build the feature one vertical slice at a time
```

`grill-with-docs` updates `CONTEXT.md` and `docs/adr/` inline as decisions crystallize. By the time you reach `/tdd`, the feature has names, boundaries, and recorded trade-offs. `tdd` reads `CONTEXT.md` so test names and interface vocabulary match the project's language.

### Inherited an unfamiliar codebase

```
Read CONTEXT.md (or run /setup-toolbox-context if none exists)
  ↓
/zoom-out                # ask for one-layer-up maps as you encounter unfamiliar code
  ↓ (after a few days)
/improve-codebase-architecture   # find deepening opportunities, generate HTML review
```

`zoom-out` is cheap and one-shot — use it the moment you're inside a file but don't know its caller-graph. `improve-codebase-architecture` is heavier — runs an HTML report and a grilling loop, do it every few days, not every session.

### Hard bug or performance regression

```
/diagnose                # Phase 1 = build a feedback loop. Everything else is mechanical.
```

If the bug description is ambiguous, prefix with `/grill-me` to nail down the actual failure mode before reaching for `/diagnose`. Build a loop you trust, then bisect, instrument, fix.

### Long session is running out of context

```
/handoff "<focus for next session>"
  ↓
(open fresh session)
  Read the handoff path that was printed
```

`handoff` writes to your OS temp dir, redacts secrets, references rather than duplicates artifacts that already exist on disk. Suggested-skills section tells the next session what to reach for.

### A response thread is getting verbose

```
caveman mode
```

Persists for the whole session. Say `normal mode` to exit. Drops back to verbose automatically for destructive-action confirmations and security warnings.

## The CONTEXT.md + ADR convention

Two artifacts at the project's root (or per bounded context) that every adopted skill knows how to read and update.

### CONTEXT.md — the project glossary

A short doc that defines the project's vocabulary, with `_Avoid_:` aliases for terms that should not be used. Cribbed from Domain-Driven Design's "ubiquitous language."

Before:
> "There's a problem when a lesson inside a section of a course is made 'real' (i.e. given a spot in the file system)"

After (with `CONTEXT.md` defining `materialization`):
> "There's a problem with the materialization cascade"

That concision pays off session after session. Agent code starts using the same names — variables, files, functions all converge on the canonical terms.

### docs/adr/NNNN-<decision>.md — architecture decision records

Numbered markdown files capturing decisions that are:

1. **Hard to reverse** — the cost of changing your mind later is meaningful
2. **Surprising without context** — a future reader will wonder "why this way?"
3. **The result of a real trade-off** — there were alternatives and you picked one for specific reasons

If any of the three is missing, skip the ADR. Don't fill the directory with trivia.

### Single vs multi-context layout

| Layout | When to use | Files |
|---|---|---|
| Single-context | Most repos | `CONTEXT.md` at root, `docs/adr/` at root |
| Multi-context | Monorepos with bounded contexts (e.g., `src/ordering/`, `src/billing/`) | `CONTEXT-MAP.md` at root pointing to per-module `CONTEXT.md` files |

### Bootstrapping

Run `/setup-toolbox-context` once per repo. It detects existing state, picks the layout, creates `CONTEXT.md` with seed terms you supply, creates `docs/adr/` with a convention stub, and optionally appends a "Domain Documentation" section to `CLAUDE.md` or `AGENTS.md`. It never creates empty placeholder files.

Format details: `skills/grill-with-docs/references/CONTEXT-FORMAT.md` and `skills/grill-with-docs/references/ADR-FORMAT.md`.

## Per-skill quick reference

### Engineering

#### `grill-with-docs`

- **What**: interview that maintains `CONTEXT.md` and `docs/adr/` as a side effect
- **Trigger**: "grill me with docs", "grill on the design", `/grill-with-docs`
- **Inputs**: an open design question or plan
- **Side effects**: writes to `CONTEXT.md`, creates ADRs

#### `tdd`

- **What**: red-green-refactor with vertical slices; calls out the horizontal-slice anti-pattern
- **Trigger**: "use TDD", "red-green-refactor", `/tdd`
- **Inputs**: a clear behavior to verify; usually preceded by a grilling session
- **Side effects**: writes tests + minimal implementation, one slice at a time

#### `diagnose`

- **What**: disciplined debugging — Phase 1 builds a deterministic feedback loop, the rest is bisection / hypothesise / instrument / fix / regression-test
- **Trigger**: "diagnose this", "debug this", reports of broken/flaky/slow behavior, `/diagnose`
- **Inputs**: a bug report or perf regression
- **Side effects**: temporary instrumentation (tagged for cleanup), a permanent regression test

#### `improve-codebase-architecture`

- **What**: finds "deepening opportunities" (Ousterhout) — modules that should be deeper with simpler interfaces
- **Trigger**: "improve architecture", "find deepening opportunities", "rescue the ball of mud", `/improve-codebase-architecture`
- **Inputs**: `CONTEXT.md` and `docs/adr/` populated; codebase to analyze
- **Side effects**: HTML report in your OS temp dir; a grilling loop to act on findings

#### `zoom-out`

- **What**: maps modules and callers around the code in focus, using project vocabulary
- **Trigger**: "zoom out", `/zoom-out` — user-invoked only (deliberately not auto-triggered)
- **Inputs**: a specific file or function to anchor against
- **Side effects**: none — output is a map for the conversation

#### `setup-toolbox-context`

- **What**: scaffolds `CONTEXT.md` + `docs/adr/` lazily
- **Trigger**: "set up context", "init context.md", `/setup-toolbox-context`
- **Inputs**: optionally `--single` or `--multi`; otherwise detected from repo
- **Side effects**: writes `CONTEXT.md` (or `CONTEXT-MAP.md`), creates `docs/adr/` with a README stub, optionally appends to `CLAUDE.md`/`AGENTS.md`

### Productivity

#### `grill-me`

- **What**: relentless one-question-at-a-time interview toward shared understanding
- **Trigger**: "grill me", "interview me", `/grill-me`
- **Inputs**: any plan, design, or decision — domain-neutral (works for marketing plans, doc outlines, product decisions, code)
- **Side effects**: none — pure interview

#### `handoff`

- **What**: compacts the conversation into a handoff doc for the next session
- **Trigger**: "/handoff [next-session focus]"
- **Inputs**: the current conversation
- **Side effects**: writes a markdown file to OS temp dir; prints the absolute path as the final line so you can copy-paste it into the next session

#### `caveman`

- **What**: persistent ultra-compressed response mode (~75% token reduction)
- **Trigger**: "caveman mode", "be brief", `/caveman`
- **Inputs**: none — just a behavior toggle
- **Side effects**: every subsequent response is compressed; drops back to verbose for security warnings and destructive-action confirmations; deactivates on "stop caveman" or "normal mode"

## Attribution and upstream sync

All adopted skills carry an `_attribution.md` pointing at the upstream commit in [mattpocock/skills](https://github.com/mattpocock/skills). The base commit for the initial adoption is `b8be62ffacb0118fa3eaa29a0923c87c8c11985c` (2026-05-22).

To check for upstream changes:

```bash
gh api repos/mattpocock/skills/commits/main --jq '.sha'
gh api repos/mattpocock/skills/commits --jq '.[].sha' | grep -B1 b8be62ffacb0118fa3eaa29a0923c87c8c11985c
```

If a skill has been updated upstream, re-run the adoption process:

1. Fetch the new upstream SKILL.md and bundled resources
2. Run `/skill-forge refine skills/<name>` against the new content
3. Update `_attribution.md` with the new commit SHA and adoption date

The cleanest path is the same one used for the initial adoption — caveman as pilot, then batch the rest. The `_attribution.md` files anchor the diff.

## What was deliberately not adopted

For posterity and future-you reading this:

- `to-prd`, `to-issues`, `triage` — GitHub-issue-workflow skills. Skipped because the adoption did not commit to an issue-tracker workflow inside this repo.
- `prototype` — throwaway-prototype skill. Skipped as too broad for the current need.
- `write-a-skill` — superseded by `skill-forge`, which does more (create + evaluate + refine).
- `setup-matt-pocock-skills` — replaced by `setup-toolbox-context` with reduced scope (CONTEXT.md + ADRs only; no issue tracker or triage label scaffolding).
- `migrate-to-shoehorn`, `scaffold-exercises` — Matt-specific (his TS library, his course-publishing format).
- `setup-pre-commit`, `git-guardrails-claude-code` — opinionated hook recipes that conflict with toolbox conventions.

If any of these become relevant later, the adoption process is the same. Just open the upstream link, run the pilot, then batch.
