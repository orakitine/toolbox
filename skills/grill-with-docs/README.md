# grill-with-docs

Grilling interview that stress-tests a plan against the project's existing domain language and documented decisions. Same one-question-at-a-time interview style as `grill-me`, but it also maintains two living artifacts as the conversation goes: `CONTEXT.md` (the project glossary) and `docs/adr/NNNN-*.md` (architecture decision records).

## Quick start

Trigger any of:

- `grill me with docs`
- `grill on the design`
- `challenge this against our context`
- `/grill-with-docs`

The skill looks for existing domain docs (`CONTEXT.md`, `CONTEXT-MAP.md`, `docs/adr/`), interviews you one question at a time, and updates the docs inline as terms and decisions resolve.

## What it produces

- **`CONTEXT.md`** — the project's ubiquitous-language glossary. Terms get added the moment they resolve during the interview. Format defined in `references/CONTEXT-FORMAT.md`.
- **`docs/adr/NNNN-<slug>.md`** — architecture decision records, created only when a decision passes all three tests: hard to reverse, surprising without context, the result of a real trade-off. Format defined in `references/ADR-FORMAT.md`.

Both file types are created lazily — the skill writes them only when something concrete needs to be captured. No empty scaffolds.

## Key behavior

- **Glossary-aware.** Challenges fuzzy terms against the existing `CONTEXT.md` and proposes canonical alternatives.
- **Code-aware.** Cross-references the plan against the actual code and surfaces contradictions.
- **Multi-context aware.** If `CONTEXT-MAP.md` exists at the root, the skill infers which context the topic belongs to and writes to that context's `CONTEXT.md`.
- **ADRs are rare by design.** The three-test gate exists to keep `docs/adr/` signal-heavy rather than noise-heavy.

## Attribution

Adapted from [mattpocock/skills](https://github.com/mattpocock/skills). See `_attribution.md`.

## Related

- `grill-me` — same interview style, no domain docs. Use when you just want the grilling.
- `caveman` — terse output mode. Pair if you want the interview compressed.
