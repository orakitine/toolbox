# grill-me

Relentless interview mode that drives toward shared understanding of a plan or design. Walks each branch of the decision tree one question at a time, with a recommended answer attached to each question.

Works for any subject: a marketing plan, a doc outline, a product decision, a code change.

## Quick start

Trigger any of:

- `grill me`
- `interview me`
- `/grill-me`

The next response asks exactly one question with a recommended answer. The interview continues turn by turn until both sides share the same mental model.

## Key behavior

- **One question per turn.** Never batches. Each question comes with a recommended answer.
- **Branch by branch.** Resolves dependencies between decisions one-by-one rather than jumping around.
- **Source first.** Questions answerable from the codebase (or other source-of-truth artifact) are resolved by exploration, not by asking the user.
- **Relentless.** Continues until shared understanding is reached.

## Attribution

Adapted from [mattpocock/skills](https://github.com/mattpocock/skills). See `_attribution.md`.

## Related

- `caveman` — terse output mode. Pair with `grill-me` if you want the interview compressed.
