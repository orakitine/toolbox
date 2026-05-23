# improve-codebase-architecture

Finds **deepening opportunities** in a codebase — refactors that turn shallow modules into deep ones (small interface, large implementation). The skill is informed by the project's domain language (`CONTEXT.md`) and respects its architecture decisions (`docs/adr/`). It produces a visual HTML report of candidates, then drops into a grilling conversation on whichever one you pick.

The aim is testability and AI-navigability — code where bugs concentrate in one place, where tests cross the same seam as callers, and where the language used to describe the system matches the language used inside it.

## Quick start

Trigger any of:

- `improve architecture`
- `find deepening opportunities`
- `rescue the ball of mud`
- `consolidate tightly-coupled modules`
- `find refactoring opportunities`
- `make code more testable`
- `/improve-codebase-architecture`

The skill will:

1. Read `CONTEXT.md` and ADRs in the area you're touching.
2. Walk the codebase with an exploration agent, looking for shallow modules, leaked seams, and untestable surfaces.
3. Produce an HTML report (Tailwind + Mermaid, written to your OS temp dir) with before/after diagrams for each candidate.
4. After you pick one, grill the design with you — naming the deepened module, classifying its dependencies, deciding what (if anything) belongs behind a seam.

## What it analyzes

- **Shallow modules** — interfaces nearly as complex as their implementation. Candidates for collapse.
- **Leaked seams** — coupling that crosses module boundaries through hidden channels (shared mutable state, transitive types, sneaky imports).
- **Pass-through extractions** — pure functions extracted only for testability while the bugs hide in how they're called.
- **Untestable surfaces** — areas where the current interface forces tests to peek past it.
- **Dependency category** — each candidate is classified (in-process / local-substitutable / remote-but-owned / true-external) so the seam discipline matches the reality.

The report's vocabulary stays inside the glossary: **module**, **interface**, **implementation**, **depth**, **deep**, **shallow**, **seam**, **adapter**, **leverage**, **locality**. No "component," no "service," no "boundary."

## Prerequisites

The skill is informed by two project artifacts:

- **`CONTEXT.md`** (domain glossary) — the suggestions use this vocabulary when naming candidates. If missing, the skill creates it lazily as terms get sharpened during grilling.
- **`docs/adr/`** (architecture decision records) — the skill respects existing decisions and only contradicts an ADR when friction is real enough to warrant reopening it. If missing, an ADR can be offered when you reject a candidate with a load-bearing reason.

Neither file is required to run the skill — but both make it sharper.

## Output

A single self-contained HTML file written to your OS temp dir (`$TMPDIR/architecture-review-<timestamp>.html`). Tailwind via CDN for layout, Mermaid via CDN for graph-shaped diagrams, hand-built SVG/divs for editorial visuals (mass diagrams, cross-sections, call-graph collapse). Each candidate is one card with before/after diagrams, a recommendation strength badge, and ADR conflict callouts when relevant.

Nothing lands in the repo.

## Related

- `tdd` — applies the same vocabulary (deep modules, interface as test surface, seam discipline) during red-green-refactor cycles. Pairs well: use this skill to find what to deepen, then `tdd` to drive the change.
- `grill-with-docs` — companion skill for the lazy `CONTEXT.md` / `docs/adr/` discipline. This skill follows the same conventions and reuses the formats.
- `skill-forge` — produced the refined structure of this skill.

## Attribution

Adapted from [mattpocock/skills](https://github.com/mattpocock/skills). See `_attribution.md`.
