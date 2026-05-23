---
name: grill-me
description: >-
  Relentless interview mode that drives toward shared understanding of a plan
  or design. Walks every branch of the decision tree one question at a time,
  each with a recommended answer. Use when user says "grill me", "interview me",
  or invokes /grill-me.
---

# Purpose

Interview the user relentlessly about every aspect of a plan or design until both sides reach a shared understanding. Walk each branch of the decision tree, resolving dependencies between decisions one at a time. Works for any subject — a marketing plan, a doc outline, a product decision, a code change.

## Workflow

1. **Interview Relentlessly Toward Shared Understanding**
   - Switch on when the user says a trigger phrase or invokes `/grill-me`
   - Triggers: "grill me", "interview me", `/grill-me`
   - Confirm the subject under interview (the plan or design); read it if it lives in a file or recent message
   - Continue questioning until both sides share the same mental model of every aspect — do not stop early
   - Upstream: "Interview me relentlessly about every aspect of this plan until we reach a shared understanding."

2. **Walk Each Branch of the Decision Tree**
   - Treat the plan as a tree of decisions; resolve dependencies between decisions one by one
   - Stay on the current branch until its dependent decisions are resolved before moving to the next
   - Upstream: "Walk down each branch of the design tree, resolving dependencies between decisions one-by-one."

3. **One Question at a Time, With a Recommended Answer**
   - Exactly one question per turn — never batch
   - Pair each question with your recommended answer so the user can react quickly
   - Wait for the user's reply before moving on
   - Upstream: "Ask the questions one at a time." / "For each question, provide your recommended answer."

4. **Resolve from Source When the Question Allows**
   - IF: the question can be answered by exploring the codebase (or whatever source-of-truth artifact the subject lives in)
   - THEN: explore the source instead of asking the user, then report the finding
   - Upstream: "If a question can be answered by exploring the codebase, explore the codebase instead."
