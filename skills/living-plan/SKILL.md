---
name: living-plan
description: >-
  Authors and maintains a living, executable engineering plan as a single
  Markdown document in docs/plans/. The plan has a fixed goal (Purpose + a
  Definition of Done) but a living path: a status-tracked phase/task checklist
  ([] idle, [wip] in progress, [x] done, [f] failed), an append-only amendments
  log, and metadata that survives across agents and sessions. Reads CONTEXT.md
  for domain vocabulary and links docs/adr/ decisions; never writes ADRs itself.
  Use when the user wants to plan, spec, or design new work; update or extend an
  existing plan; link plans/ADRs; or build (execute) a plan — or invokes
  /living-plan. Triggers: "plan this", "write a spec", "design doc", "living
  plan", "build the plan", "/living-plan".
argument-hint: "[user-prompt] [questionable]"
---

# Living Plan

## Purpose

Author a detailed, **Markdown-first** implementation plan and keep it alive across its whole lifecycle. The plan is a single self-contained `.md` file under `docs/plans/` that the **trifecta** — the engineer, the team, and AI agents (including a multi-agent swarm) — can create, read, update, and execute.

It is a *living* document with a deliberate split:

- **Fixed goal (the anchor):** the `Purpose` and the global `Validation Commands` define *what done means*. This does not drift silently.
- **Living path (what evolves):** the phase/task checklist, its status markers, the notes, the questionables, and the append-only `Amendments` log.

Moving the goalpost is allowed — reality changes and you learn things — but it is a **deliberate, logged event** (an `Amendments` entry with rationale, and a nudge to re-grill or record an ADR), never silent scope creep. Progress updates are frictionless; goal changes leave a trail.

## Variables

```
USER_PROMPT:        $1          # the planning request; falls back to the user's natural-language ask if no positional arg
QUESTIONABLE:       $2 — default false
PLAN_OUTPUT_DIR:    docs/plans/
PLAN_FILE:          docs/plans/<descriptive-kebab-name>.md
CONTEXT_FILE:       CONTEXT.md  (or the nearest per-context CONTEXT.md in a multi-context repo; see setup-toolbox-context)
ADR_DIR:            docs/adr/
```

## Conventions

These rules apply across all four workflows below.

- IMPORTANT: If no `USER_PROMPT` is provided, stop and ask the user to provide it.
- THINK HARD about the best approach before authoring. Explore the codebase for existing patterns, prior plans in `docs/plans/`, and architecture.
- **Read `CONTEXT.md` first** (or the nearest per-context one). Use the project's domain vocabulary verbatim in the plan — same discipline as `grill-with-docs`, `zoom-out`, and `tdd`. If no `CONTEXT.md` exists, proceed in plain language and note that running `setup-toolbox-context` would let future plans speak the domain.
- **Link, never author, ADRs.** When the plan rests on a recorded decision, link the relevant `docs/adr/NNNN-*.md` as a back-reference. When a *new* load-bearing decision surfaces, flag it in `Questionables` and recommend `grill-with-docs` (which writes ADRs) — this skill never writes to `docs/adr/`. ADRs are rare; most decisions live in the plan's Notes/Questionables.
- The plan is **Markdown-first**: produce a single self-contained `.md` document from `reference/plan-template.md`. Replace EVERY `{{PLACEHOLDER}}`; leave no `{{}}` token in the final file. Blocks marked `<!-- repeat -->` are duplicated as many times as needed, then the markers are deleted.
- **Status markers are 4-state:** `[]` idle · `[wip]` in progress · `[x]` complete · `[f]` failed. All tasks start `[]`; `build-plan` advances them. These are richer than native Markdown checkboxes on purpose — `[wip]` and `[f]` are what make the plan a coordination ledger for a swarm. Use the literal markers, not `- [ ]`.
- **Diagrams are optional and text-native:** use Mermaid fenced code blocks only where a diagram earns its place (architecture, phase flow, data model). No image files, no generation step. Never add decorative "hero" diagrams.
- **Metadata is YAML frontmatter**, append-only: every field except `created` is a list that is only ever appended to — never overwrite or remove existing entries. This is how the plan stays coherent across many agents and sessions.
- Ensure the plan is detailed enough that another developer or agent could implement it. Express each phase's **Testing Strategy as behaviors through the public interface** (the input `tdd` consumes), in addition to the global shell `Validation Commands`.
- If `QUESTIONABLE` is true, surface open decisions/assumptions/risks in the `Questionables` section rather than silently deciding, and recommend a grilling pass on them.
- Save the plan to `PLAN_FILE` with a descriptive kebab-case filename.

## Workflow

Based on the `USER_PROMPT`, select the single best-matching workflow and read its file in `cookbook/` for step-by-step instructions before acting.

| Workflow | When to call it | File to read |
| --- | --- | --- |
| Create Plan | The prompt asks to plan, spec, or design new work and no existing plan is referenced | `cookbook/create-plan.md` |
| Update Plan | The prompt asks to change, extend, or revise the content of an existing plan | `cookbook/update-plan.md` |
| Update References | The prompt asks to refresh plan metadata or link plans/ADRs (back/forward references) | `cookbook/update-references.md` |
| Build Plan | The prompt asks to implement, execute, or carry out the work described in an existing plan | `cookbook/build-plan.md` |

The Markdown plan structure to fill is in `reference/plan-template.md`.

## Works well with

These are **optional** collaborators — `living-plan` runs standalone, and gracefully degrades when a neighbor is not installed. (Soft synergy only; declare no hard `requires` in the registry.)

- **`setup-toolbox-context`** — scaffolds the `CONTEXT.md` glossary and `docs/adr/` directory this skill reads from. Run it first on a new project; without it, plans fall back to plain language.
- **`grill-me` / `grill-with-docs`** — resolve the decision tree *before* (or alongside) planning. Two flows:
  - **grill-first:** grill → `create-plan` → a plan with few open questionables.
  - **plan-first (strawman):** `create-plan questionable` surfaces the open decisions → grill them → `update-plan` folds the resolutions back in.
  `grill-with-docs` is also what *writes* the ADRs this skill only links.
- **`tdd`** — `build-plan` delegates the actual test-first implementation of each task to `tdd`, handing it the task's behaviors (from the Testing Strategy) and the linked ADRs, and treating the plan as the already-approved design. If `tdd` is not installed, `build-plan` implements directly. `tdd` is fully usable without ever touching this skill.
- **`zoom-out`** — when authoring a plan inside unfamiliar code, map the surrounding modules/callers in the project's vocabulary first.
- **`handoff`** — orthogonal context-transfer utility, not a pipeline stage. A `handoff` doc *references* the plan path (`docs/plans/...`) rather than duplicating it, so a fresh agent can resume against the living plan.

## Multi-agent note

A living-plan is a shared coordination artifact for a swarm: the fixed Purpose + Definition of Done is the north star, the `[wip]`/`[x]`/`[f]` markers are a live progress ledger, and the append-only `agent`/`session` metadata attributes work across instances. Concurrent writes to one file conflict — so in a swarm, have **one orchestrator own plan writes while workers report up**, or partition ownership by phase. Capture the chosen ownership model in the plan's Notes.
