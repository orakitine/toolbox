---
name: tdd
description: >-
  Test-driven development via the red-green-refactor loop using vertical slices
  (one test → one implementation at a time). Tests verify behavior through public
  interfaces, not implementation details. Use when user wants to build a feature
  or fix a bug test-first, says "TDD", "red-green-refactor", "test-first", "write
  tests first", asks for integration tests, or invokes `/tdd`.
---

# Purpose

Drive feature development and bug fixes through tight red-green-refactor cycles, one behavior at a time. Tests verify observable behavior through public interfaces so they survive internal refactors. Vertical slices (tracer bullets) replace the "write all tests, then all code" anti-pattern because tests written in bulk inevitably test imagined behavior — not actual behavior.

## Philosophy

**Tests verify behavior through public interfaces, not implementation details.** Code can change entirely; tests shouldn't.

- **Good tests** are integration-style: they exercise real code paths through public APIs. They describe _what_ the system does, not _how_. A good test reads like a specification — "user can checkout with valid cart" tells you exactly what capability exists. These tests survive refactors because they don't care about internal structure.
- **Bad tests** are coupled to implementation. They mock internal collaborators, test private methods, or verify through external means (querying a database directly instead of using the interface). The warning sign: your test breaks when you refactor, but behavior hasn't changed. If you rename an internal function and tests fail, those tests were testing implementation, not behavior.

**Anti-pattern: horizontal slices.** DO NOT write all tests first, then all implementation. That treats RED as "write all tests" and GREEN as "write all code." It produces crap tests because:

- Tests written in bulk test _imagined_ behavior, not _actual_ behavior
- You end up testing the _shape_ of things (data structures, function signatures) rather than user-facing behavior
- Tests become insensitive to real changes — they pass when behavior breaks, fail when behavior is fine
- You outrun your headlights, committing to test structure before understanding the implementation

**Correct approach: vertical slices via tracer bullets.** One test → one implementation → repeat. Each test responds to what you learned from the previous cycle.

```
WRONG (horizontal):
  RED:   test1, test2, test3, test4, test5
  GREEN: impl1, impl2, impl3, impl4, impl5

RIGHT (vertical):
  RED→GREEN: test1→impl1
  RED→GREEN: test2→impl2
  RED→GREEN: test3→impl3
  ...
```

## Workflow

1. **Plan with the user before writing any code**
   - Explore the codebase. Use the project's domain glossary so test names and interface vocabulary match the project's language. Respect ADRs in the area you're touching.
   - Confirm with the user what interface changes are needed
   - Confirm with the user which behaviors to test, and prioritize them — you can't test everything, so focus on critical paths and complex logic, not every possible edge case
   - Identify opportunities for **deep modules** (small interface, deep implementation) — see `./references/deep-modules.md`
   - Design interfaces for **testability** (accept dependencies, return results, small surface) — see `./references/interface-design.md`
   - List behaviors to test (not implementation steps)
   - Get user approval on the plan before proceeding
   - Example: User asks to add a checkout flow → ask "What should the public `checkout()` interface look like? Which behaviors matter most — happy path, invalid cart, payment failure, partial refund?" Get explicit prioritization before any test is written.

2. **Fire the tracer bullet**
   - Write ONE test that confirms ONE thing about the system
   - RED: test fails (confirm it fails for the right reason — not a syntax error)
   - GREEN: write the minimum code to make it pass
   - This proves the path works end-to-end before you build more on top of it
   - Example:
     ```
     RED:   test("checkout with valid cart returns confirmed status") → fails (no checkout fn)
     GREEN: implement minimal checkout() returning { status: "confirmed" } → test passes
     ```

3. **Loop one behavior at a time**
   - For each remaining behavior, run RED → GREEN
   - Rules:
     - One test at a time
     - Only enough code to pass the current test
     - Do NOT anticipate future tests
     - Keep tests focused on observable behavior through the public interface
   - After each GREEN, run the **per-cycle checklist**:
     - [ ] Test describes behavior, not implementation
     - [ ] Test uses public interface only
     - [ ] Test would survive an internal refactor
     - [ ] Code is minimal for this test
     - [ ] No speculative features added
   - IF: the test breaks when you rename an internal function but behavior is unchanged → THEN the test is coupled to implementation; rewrite it against the public interface (see `./references/tests.md` for good/bad examples)
   - IF: the behavior crosses a system boundary (external API, database, time, randomness, filesystem) → THEN mock at that boundary only — never mock internal collaborators (see `./references/mocking.md`)
   - Example: Next behavior is "checkout with empty cart returns error" → write that test alone, watch it fail, add the minimal guard clause, watch it pass, then run the checklist.

4. **Refactor only while GREEN**
   - Never refactor while RED. Get to GREEN first.
   - After all tests for the current slice pass, look for refactor candidates: duplication, long methods, shallow modules, feature envy, primitive obsession, and existing code the new code reveals as problematic (see `./references/refactoring.md`)
   - Apply changes:
     - Extract duplication
     - Deepen modules (move complexity behind simple interfaces)
     - Apply SOLID principles where natural
     - Consider what the new code reveals about existing code
   - Run tests after EACH refactor step. If anything goes red, undo or fix immediately before the next step.
   - Example: After three checkout tests are green you notice cart-total math repeated in two places → extract `calculateTotal(cart)`, run tests, all green → continue.

5. **Return to the loop or finish**
   - IF: more prioritized behaviors remain → return to step 3
   - IF: all prioritized behaviors are covered and refactor pass is clean → summarize what was built, which behaviors are covered, and any deferred behaviors the user explicitly chose not to test
   - Example: "Checkout flow done. Covered: valid cart, empty cart, payment failure. Deferred per your call: partial refund (edge case, low priority)."

## References

### Good vs. bad tests, with examples

- IF: deciding whether a test is well-formed, debugging a test that breaks on refactor, or unsure what to assert
- THEN: Read `./references/tests.md`
- EXAMPLES:
  - "is this test testing implementation or behavior?"
  - "my tests keep breaking when I rename things"
  - "what should I assert here?"

### Mocking and system boundaries

- IF: about to mock something, designing an external integration, or wondering if a dependency should be injected
- THEN: Read `./references/mocking.md`
- EXAMPLES:
  - "should I mock the database?"
  - "how do I test this Stripe integration?"
  - "this function is hard to mock — what do I change?"

### Interface design for testability

- IF: designing a new function or module, or an existing one is painful to test
- THEN: Read `./references/interface-design.md`
- EXAMPLES:
  - "this function takes too many params to test"
  - "how should I shape this API?"
  - "the test setup is enormous — what's wrong with the interface?"

### Deep modules (small interface, deep implementation)

- IF: an interface feels too wide, too many methods, or wraps trivial logic
- THEN: Read `./references/deep-modules.md`
- EXAMPLES:
  - "is this module too shallow?"
  - "should I split or combine these classes?"
  - "this wrapper does almost nothing — keep it?"

### Refactor candidates after GREEN

- IF: all tests pass and you're entering the refactor step
- THEN: Read `./references/refactoring.md`
- EXAMPLES:
  - "what should I refactor now that tests pass?"
  - "I see duplication — extract or leave?"
  - "the new code makes the old code look bad — what do I do?"

## Works well with

Optional collaborators — `tdd` runs standalone and these degrade gracefully if absent.

- **`grill-with-docs`** (or `grill-me`) — align on scope, interface, and behaviors before the first test; `grill-with-docs` also records the ADRs `tdd` should respect.
- **`living-plan`** — its `build` workflow delegates the test-first implementation of each task to `tdd`, handing over the plan's behaviors as the approved design. `tdd` stays fully usable without it.
- **`diagnose`** — after a diagnosis pins a bug, lock the fix with a `tdd` regression test.
- **`setup-toolbox-context`** — provides the `CONTEXT.md` vocabulary `tdd` uses for test and interface names.
