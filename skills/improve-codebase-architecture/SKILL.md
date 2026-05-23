---
name: improve-codebase-architecture
description: >-
  Find deepening opportunities in a codebase — refactors that turn shallow
  modules into deep ones, informed by the domain language in CONTEXT.md and
  the decisions in docs/adr/. The aim is testability and AI-navigability.
  Use when user wants to "improve architecture", "find deepening opportunities",
  "rescue the ball of mud", "consolidate tightly-coupled modules", "find
  refactoring opportunities", "make code more testable", or invokes
  `/improve-codebase-architecture`.
---

# Purpose

Surface architectural friction in a codebase and propose **deepening opportunities** — refactors that turn shallow modules into deep ones. A deep module hides a lot of behaviour behind a small interface; the result is better leverage for callers, better locality for maintainers, and tests that survive internal refactors. The skill is _informed_ by the project's domain model: the domain language gives names to good seams, and ADRs record decisions the skill should not re-litigate.

## Glossary

Use these terms exactly in every suggestion. Consistent language is the point — don't drift into "component," "service," "API," or "boundary." Full definitions in [./references/LANGUAGE.md](./references/LANGUAGE.md).

- **Module** — anything with an interface and an implementation (function, class, package, slice).
- **Interface** — everything a caller must know to use the module: types, invariants, error modes, ordering, config. Not just the type signature.
- **Implementation** — the code inside.
- **Depth** — leverage at the interface: a lot of behaviour behind a small interface. **Deep** = high leverage. **Shallow** = interface nearly as complex as the implementation.
- **Seam** — where an interface lives; a place behaviour can be altered without editing in place. (Use this, not "boundary.")
- **Adapter** — a concrete thing satisfying an interface at a seam.
- **Leverage** — what callers get from depth.
- **Locality** — what maintainers get from depth: change, bugs, knowledge concentrated in one place.

Key principles (see [./references/LANGUAGE.md](./references/LANGUAGE.md) for the full list):

- **Deletion test**: imagine deleting the module. If complexity vanishes, it was a pass-through. If complexity reappears across N callers, it was earning its keep.
- **The interface is the test surface.**
- **One adapter = hypothetical seam. Two adapters = real seam.**

## Prerequisites

- Project should have a `CONTEXT.md` (domain glossary) — the skill uses its vocabulary when naming candidates. If missing, the skill will create it lazily as terms get sharpened in the grilling loop.
- Project should have `docs/adr/` (architecture decision records) — the skill respects existing decisions and only contradicts an ADR when friction is real enough to warrant reopening it. If missing, an ADR can be offered when the user rejects a candidate with a load-bearing reason.

## Workflow

1. **Read the project's domain glossary and ADRs first**
   - Open `CONTEXT.md` if present and read every definition — the suggestions you write must use this vocabulary.
   - Open every ADR in `docs/adr/` for the area you're about to touch.
   - IF: `CONTEXT.md` is missing → THEN: proceed without it, but plan to create it lazily during the grilling loop (step 3).
   - IF: an ADR covers the area → THEN: don't re-litigate it unless friction in step 2 is severe.
   - Example: about to review the order-intake area → read every ADR tagged `order-intake` plus the `CONTEXT.md` entries for Order, Cart, Checkout before anything else.

2. **Explore the codebase for friction**
   - Use the Agent tool with `subagent_type=Explore` (or equivalent exploration agent) to walk the codebase.
   - Don't follow rigid heuristics — explore organically and note where you experience friction:
     - Where does understanding one concept require bouncing between many small modules?
     - Where are modules **shallow** — interface nearly as complex as the implementation?
     - Where have pure functions been extracted just for testability, but the real bugs hide in how they're called (no **locality**)?
     - Where do tightly-coupled modules leak across their seams?
     - Which parts of the codebase are untested, or hard to test through their current interface?
   - Apply the **deletion test** to anything you suspect is shallow: would deleting it concentrate complexity, or just move it? A "yes, concentrates" is the signal you want.
   - Example: walking `src/order/` you find a `OrderHandler` that calls `OrderValidator` that calls `OrderRepo` that calls `PricingClient` — pricing logic leaks across the seam. Suspect shallowness → apply the deletion test → confirmed candidate.

3. **Present candidates as an HTML report**
   - Write a self-contained HTML file to the OS temp directory so nothing lands in the repo. Resolve the temp dir from `$TMPDIR`, falling back to `/tmp` (or `%TEMP%` on Windows), and write to `<tmpdir>/architecture-review-<timestamp>.html` so each run gets a fresh file.
   - Open it for the user — `xdg-open <path>` on Linux, `open <path>` on macOS, `start <path>` on Windows — and tell them the absolute path.
   - The report uses **Tailwind via CDN** for layout and **Mermaid via CDN** for graph-shaped diagrams. Mix Mermaid with hand-crafted CSS/SVG visuals — use Mermaid when relationships are graph-shaped (call graphs, dependencies, sequences), and hand-built divs/SVG for editorial visuals (mass diagrams, cross-sections, collapse animations). Each candidate gets a **before/after visualisation**. Be visual.
   - Each candidate is rendered as a card with:
     - **Files** — which files/modules are involved
     - **Problem** — why the current architecture is causing friction
     - **Solution** — plain English description of what would change
     - **Benefits** — explained in terms of locality and leverage, and how tests would improve
     - **Before / After diagram** — side-by-side, custom-drawn, illustrating the shallowness and the deepening
     - **Recommendation strength** — one of `Strong`, `Worth exploring`, `Speculative`, rendered as a badge
   - End the report with a **Top recommendation** section: which candidate you'd tackle first and why.
   - **Use CONTEXT.md vocabulary for the domain, and [./references/LANGUAGE.md](./references/LANGUAGE.md) vocabulary for the architecture.** If `CONTEXT.md` defines "Order," talk about "the Order intake module" — not "the FooBarHandler," and not "the Order service."
   - IF: a candidate contradicts an existing ADR → THEN: only surface it when the friction is real enough to warrant revisiting the ADR. Mark it clearly in the card (e.g. an amber warning callout: _"contradicts ADR-0007 — but worth reopening because…"_). Don't list every theoretical refactor an ADR forbids.
   - See [./references/HTML-REPORT.md](./references/HTML-REPORT.md) for the full HTML scaffold, diagram patterns, and styling guidance.
   - Do NOT propose interfaces yet. After the file is written, ask the user: _"Which of these would you like to explore?"_

4. **Grilling loop on the chosen candidate**
   - Once the user picks a candidate, drop into a grilling conversation. Walk the design tree with them — constraints, dependencies, the shape of the deepened module, what sits behind the seam, what tests survive.
   - Classify the candidate's dependencies (in-process, local-substitutable, remote-but-owned, true external) — the category determines how the deepened module is tested across its seam. See [./references/DEEPENING.md](./references/DEEPENING.md).
   - Side effects happen inline as decisions crystallize:
     - IF: naming a deepened module after a concept not in `CONTEXT.md` → THEN: add the term to `CONTEXT.md` — same discipline as `/grill-with-docs`. Create the file lazily if it doesn't exist.
     - IF: sharpening a fuzzy term during the conversation → THEN: update `CONTEXT.md` right there.
     - IF: user rejects the candidate with a load-bearing reason → THEN: offer an ADR, framed as: _"Want me to record this as an ADR so future architecture reviews don't re-suggest it?"_ Only offer when the reason would actually be needed by a future explorer to avoid re-suggesting the same thing — skip ephemeral reasons ("not worth it right now") and self-evident ones.
     - IF: user wants to explore alternative interfaces for the deepened module → THEN: see [./references/INTERFACE-DESIGN.md](./references/INTERFACE-DESIGN.md) for the parallel sub-agent pattern (Design It Twice).
   - Example: user picks "Collapse the Order intake pipeline" → you walk the seam (in-process dependencies, no port needed), realize the deepened module should be called `OrderIntake` — that term is not in `CONTEXT.md` yet → add it inline → continue grilling the interface.

## References

### Dependency categories and seam discipline

- IF: classifying a candidate's dependencies, deciding whether to introduce a port, or planning how to test across the seam
- THEN: Read [./references/DEEPENING.md](./references/DEEPENING.md)
- EXAMPLES:
  - "should this seam have a port or just be merged?"
  - "we depend on Postgres — does that block deepening?"
  - "how do we test this when it talks to Stripe?"

### HTML report format and diagram patterns

- IF: writing the architecture review HTML, picking a diagram type, or wondering how to render before/after
- THEN: Read [./references/HTML-REPORT.md](./references/HTML-REPORT.md)
- EXAMPLES:
  - "what does the candidate card look like?"
  - "Mermaid or hand-built SVG for this one?"
  - "how should the top-recommendation section look?"

### Designing alternative interfaces (Design It Twice)

- IF: user picked a candidate and you want to explore radically different interfaces for the deepened module
- THEN: Read [./references/INTERFACE-DESIGN.md](./references/INTERFACE-DESIGN.md)
- EXAMPLES:
  - "what are some other ways this interface could look?"
  - "explore alternative designs in parallel"
  - "I'm not sure between minimal vs flexible — show me both"

### Architecture vocabulary (the glossary)

- IF: unsure which term to use, tempted to write "component" / "service" / "boundary," or sharpening a candidate's wording
- THEN: Read [./references/LANGUAGE.md](./references/LANGUAGE.md)
- EXAMPLES:
  - "is this a module or a service?"
  - "what's the difference between interface and adapter here?"
  - "what does 'depth' mean exactly?"
