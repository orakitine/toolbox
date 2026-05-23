---
name: grill-with-docs
description: >-
  Grilling interview that stress-tests a plan against the project's existing
  domain language and documented decisions, sharpening terminology and updating
  CONTEXT.md and ADRs inline as decisions crystallise. Use when user says "grill
  me with docs", "grill on the design", "challenge this against our context",
  or invokes /grill-with-docs.
---

# Purpose

Drive a relentless interview that challenges the user's plan against the project's existing domain model: the glossary in `CONTEXT.md` and the architectural decisions in `docs/adr/`. Sharpen fuzzy terms, surface contradictions between the plan and the code, and update the docs inline as terms and decisions resolve — capturing them as they happen, not in a batch at the end.

## Workflow

1. **Locate the Domain Documentation**
   - Look at the repo root and the area being discussed for existing docs
   - IF: `CONTEXT-MAP.md` exists at the root → the repo has multiple contexts; read the map to find which context the topic belongs to
   - IF: only a root `CONTEXT.md` exists → single-context repo, use it
   - IF: neither exists → no docs yet; create them lazily later (only when the first term or decision crystallises)
   - Also look for `docs/adr/` to see what decisions are already recorded
   - Expected layout for a single-context repo:
     ```
     /
     ├── CONTEXT.md
     ├── docs/
     │   └── adr/
     │       ├── 0001-event-sourced-orders.md
     │       └── 0002-postgres-for-write-model.md
     └── src/
     ```
   - Expected layout for a multi-context repo (decisions live per-context, system-wide decisions live at the root):
     ```
     /
     ├── CONTEXT-MAP.md
     ├── docs/adr/                          ← system-wide decisions
     ├── src/
     │   ├── ordering/
     │   │   ├── CONTEXT.md
     │   │   └── docs/adr/                  ← context-specific decisions
     │   └── billing/
     │       ├── CONTEXT.md
     │       └── docs/adr/
     ```
   - IF: multiple contexts exist and the relevant one is unclear → ask the user which context the topic belongs to

2. **Interview One Question at a Time**
   - Walk each branch of the design tree, resolving dependencies between decisions one by one
   - Exactly one question per turn — never batch
   - Pair each question with your recommended answer so the user can react quickly
   - Wait for the user's reply before moving on
   - IF: a question can be answered by exploring the codebase → explore the code instead of asking the user, then report the finding
   - Example: "I see `OrderService.cancel()` deletes the row outright. My recommended answer: cancellation is a hard delete. Is that what you mean, or do you want a soft `cancelled` state?"

3. **Challenge Against the Glossary**
   - When the user uses a term that conflicts with the existing language in `CONTEXT.md`, call it out immediately
   - Quote the existing definition and ask which meaning they intend
   - Example: "Your glossary defines 'cancellation' as removing the order from the queue, but you seem to mean refunding a paid order. Which is it — and should the glossary entry change?"

4. **Sharpen Fuzzy Language**
   - When the user uses vague or overloaded terms, propose a precise canonical term
   - Make the alternatives explicit so the user can pick
   - Example: "You're saying 'account' — do you mean the **Customer** (a person who places orders) or the **User** (a login identity)? Those are different things in your domain."

5. **Stress-Test With Concrete Scenarios**
   - When domain relationships are being discussed, invent specific scenarios that probe edge cases and force precision about the boundaries between concepts
   - Use scenarios to surface assumptions the user hasn't articulated yet
   - Example: "Say a customer cancels half an order after one item has shipped. Is that one Order in two states, or two Orders? Your answer will dictate the cancellation model."

6. **Cross-Reference With Code**
   - When the user states how something works, check whether the code agrees
   - IF: you find a contradiction between the stated plan and the actual code → surface it directly
   - Example: "Your code cancels entire Orders, but you just said partial cancellation is possible — which is right?"

7. **Update CONTEXT.md Inline When a Term Resolves**
   - When a term is resolved, update `CONTEXT.md` right there in the same turn — do not batch these up
   - IF: `CONTEXT.md` does not exist yet → create it lazily the moment the first term resolves
   - IF: multi-context repo → write to the `CONTEXT.md` of the relevant context, not the root
   - Format: see `./references/CONTEXT-FORMAT.md`
   - **Hard rule**: `CONTEXT.md` is a glossary and nothing else. It must be totally devoid of implementation details. Do not treat it as a spec, a scratch pad, or a repository for implementation decisions.
   - Example: User confirms "Customer = person or org that places orders; Client and Buyer are aliases to avoid." → immediately add a `**Customer**` entry to `CONTEXT.md` with that definition and the avoided aliases.

8. **Offer ADRs Only When All Three Tests Pass**
   - Only offer to create an ADR when ALL of the following are true:
     1. **Hard to reverse** — the cost of changing your mind later is meaningful
     2. **Surprising without context** — a future reader will wonder "why did they do it this way?"
     3. **The result of a real trade-off** — there were genuine alternatives and you picked one for specific reasons
   - IF: any one of the three is missing → skip the ADR
   - IF: an ADR is warranted and `docs/adr/` does not exist → create the directory lazily, scan for the highest existing number, and use the next one
   - Format and numbering: see `./references/ADR-FORMAT.md`
   - Example: User decides to use event sourcing for the write model. All three tests pass (hard to reverse, surprising, real trade-off vs. CRUD) → offer to create `docs/adr/0003-event-sourced-write-model.md`.
   - Example: User decides to name a variable `customerId` instead of `userId`. Easy to reverse and not surprising → skip the ADR; this is a glossary concern, not an ADR concern.

## References

### CONTEXT.md format and rules

- IF: writing or updating a `CONTEXT.md` entry, deciding what belongs in the glossary vs. an ADR, or working out the structure of a multi-context repo
- THEN: Read `./references/CONTEXT-FORMAT.md`
- EXAMPLES:
  - "what does a CONTEXT.md entry look like?"
  - "single context or multi-context — how do I tell?"
  - "should this term go in the glossary?"

### ADR format and when to record

- IF: deciding whether a decision deserves an ADR, drafting an ADR, or numbering a new one
- THEN: Read `./references/ADR-FORMAT.md`
- EXAMPLES:
  - "is this decision ADR-worthy?"
  - "what sections does an ADR need?"
  - "what number should this ADR be?"
