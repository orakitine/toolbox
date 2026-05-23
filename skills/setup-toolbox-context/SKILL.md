---
name: setup-toolbox-context
description: >-
  Scaffolds the CONTEXT.md glossary and docs/adr/ directory that grill-with-docs
  and improve-codebase-architecture expect. Single-context or multi-context
  layout based on the repo. Use when starting a new project, adopting the
  CONTEXT.md convention, or invoking /setup-toolbox-context.
disable-model-invocation: true
argument-hint: "[--single|--multi]"
allowed-tools:
  - Read
  - Bash
  - Write
  - Edit
---

# Purpose

Scaffolds the domain-documentation convention that `grill-with-docs` and `improve-codebase-architecture` rely on: a `CONTEXT.md` glossary at the repo root (or per bounded context) and a `docs/adr/` directory for architecture decision records. Detects existing state, asks only when the layout is genuinely ambiguous, and creates stubs lazily so the repo never carries empty placeholder files.

## Workflow

1. **Explore Current State**
   - Check the repo for existing context and ADR scaffolding before writing anything
   - Files to detect: `CONTEXT.md`, `CONTEXT-MAP.md`, `docs/adr/`, and any `src/*/CONTEXT.md` (signals a multi-context repo)
   - Example: `ls CONTEXT*.md docs/adr/ 2>/dev/null; find src -maxdepth 3 -name "CONTEXT.md" 2>/dev/null`
   - Report findings concisely to the user before touching anything

2. **Determine Layout**
   - IF: `CONTEXT-MAP.md` exists OR multiple `src/*/CONTEXT.md` files exist → multi-context layout, skip to step 4
   - IF: `CONTEXT.md` exists at root → single-context layout, skip to step 4
   - IF: neither exists AND user passed `--single` or `--multi` → use that
   - IF: neither exists AND no flag → ask user once: "Single context (one CONTEXT.md at root) or multi-context (CONTEXT-MAP.md + per-module CONTEXT.md, typically a monorepo)?" Default to single-context — most repos are.
   - Example: monorepo with `src/ordering/`, `src/billing/`, `src/fulfillment/` directories → recommend multi-context

3. **Create Stubs Lazily**
   - Do NOT create empty files. Only create scaffolding when there is real content to put in it.
   - IF: single-context AND no `CONTEXT.md` exists → ask user for the first 1-3 domain terms they want to define, then create `CONTEXT.md` with those terms following the format in `../grill-with-docs/references/CONTEXT-FORMAT.md`
   - IF: multi-context AND no `CONTEXT-MAP.md` exists → ask user for the names and one-line descriptions of their bounded contexts, then create `CONTEXT-MAP.md` pointing at where each lives
   - IF: `docs/adr/` does not exist → create the directory with a single `docs/adr/README.md` stub that explains the convention and links to `../grill-with-docs/references/ADR-FORMAT.md`. Do NOT create `0000-template.md` or empty placeholder ADRs.
   - Example: user gives "Order, Invoice, Customer" → write `CONTEXT.md` with those three terms, each with a one-line description and `_Avoid_:` aliases the user provides

4. **Update CLAUDE.md or AGENTS.md (Optional)**
   - IF: a `CLAUDE.md` or `AGENTS.md` exists at the repo root AND does not already mention CONTEXT.md
   - THEN: ask user whether to add a short "Domain Documentation" section pointing at `CONTEXT.md` and `docs/adr/`. Default: yes.
   - Example: append a section like "## Domain Documentation\n- `CONTEXT.md` is the project glossary; reach for it before introducing new terms.\n- `docs/adr/` records architectural decisions. See `setup-toolbox-context` and `grill-with-docs` for the conventions."
   - Skip silently if no agent-instructions file exists — don't create one just for this.

5. **Report and Hand Off**
   - List the files created or modified, with absolute paths
   - Suggest the next move: invoke `/grill-with-docs` to start populating the glossary and recording ADRs from real conversations
   - Example: "Created `/path/to/CONTEXT.md` with 3 seed terms. Created `/path/to/docs/adr/` with README stub. Next: run `/grill-with-docs` on your current design conversation to grow the glossary and capture ADRs inline."

## References

### CONTEXT.md format and rules

- IF: writing the initial `CONTEXT.md` or `CONTEXT-MAP.md`, or deciding what belongs in the glossary
- THEN: Read `../grill-with-docs/references/CONTEXT-FORMAT.md`
- EXAMPLES:
  - "what does a CONTEXT.md entry look like?"
  - "how do I structure a multi-context repo?"
  - "should this go in CONTEXT.md or an ADR?"

### ADR format and when to record

- IF: writing the `docs/adr/README.md` stub or explaining the ADR convention
- THEN: Read `../grill-with-docs/references/ADR-FORMAT.md`
- EXAMPLES:
  - "what does an ADR look like?"
  - "when is something ADR-worthy?"
  - "how should ADRs be numbered?"
