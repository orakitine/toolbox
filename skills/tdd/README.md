# tdd

Test-driven development via tight red-green-refactor cycles using vertical slices: one test, one implementation, then repeat. Tests verify observable behavior through public interfaces so they survive internal refactors. Mocks live at system boundaries only — never on internal collaborators.

## Quick start

Trigger any of:

- `TDD`
- `red-green-refactor`
- `test-first`
- `write tests first`
- `/tdd`

The skill walks you through: plan → tracer bullet → incremental RED/GREEN loop → refactor while GREEN.

## Philosophy

- **Good tests** describe WHAT the system does through its public API and survive refactors.
- **Bad tests** are coupled to HOW the system works — mocking internals, asserting on call order, peeking at databases — and break whenever you rename or reshape internals.
- **No horizontal slices.** Writing all tests up front then all the code produces tests that verify imagined behavior, not actual behavior. Vertical slices via tracer bullets keep each test grounded in what you just learned.
- **Mock only at system boundaries** — external APIs, time, randomness. Never your own modules.
- **Refactor only while GREEN.** Never while RED.

## Workflow summary

1. **Plan with the user** — confirm interface shape, prioritize behaviors, design for testability.
2. **Tracer bullet** — write one test, watch it fail for the right reason, write the minimum code to pass.
3. **Incremental loop** — one behavior at a time: RED → minimal GREEN → per-cycle checklist.
4. **Refactor while GREEN** — extract duplication, deepen modules, fix what the new code reveals; run tests after every step.
5. **Loop or finish** — return to step 3 for the next behavior, or summarize coverage and any deferred behaviors.

## Reference map

- `references/tests.md` — good vs. bad test examples
- `references/mocking.md` — when to mock, and designing for mockability
- `references/interface-design.md` — interfaces that make testing natural
- `references/deep-modules.md` — small interface, deep implementation
- `references/refactoring.md` — refactor candidates after GREEN

## Attribution

Adapted from [mattpocock/skills](https://github.com/mattpocock/skills). See `_attribution.md`.

## Related

- `quality-gate` — runs lint, type, test, and build checks. Pair with TDD to verify the broader suite before commit.
- `skill-forge` — produced the refined structure of this skill.
