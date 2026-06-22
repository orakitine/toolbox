# Create Plan

Authors a new living plan from scratch into `docs/plans/`.

1. **Analyze Requirements** — THINK HARD and parse the `USER_PROMPT` to understand the core problem and desired outcome.
2. **Read the Domain** — Read `CONTEXT.md` (or the nearest per-context one in a multi-context repo). Adopt its vocabulary verbatim in the plan. If none exists, proceed in plain language and note that `setup-toolbox-context` would let future plans speak the domain. Skim `docs/adr/` for decisions the plan must respect.
3. **Explore Codebase** — Understand existing patterns, architecture, relevant files, and prior plans in `docs/plans/` worth back-referencing. (If working in unfamiliar code, `zoom-out` first.)
4. **Design Solution** — Develop the technical approach: architecture decisions, implementation strategy, phases.
5. **Author the Plan** — Fill `reference/plan-template.md`: replace every `{{PLACEHOLDER}}`, duplicate every `<!-- repeat -->` block as needed, then delete the markers. Use 4-state status markers (all tasks start `[]`). Add Mermaid diagrams only where they earn their place.
6. **Express Testing as Behaviors** — For each phase's Testing Strategy, list **behaviors through the public interface** (what `build-plan` will hand to `tdd`), in addition to the global shell Validation Commands. The Purpose + Validation Commands together are the Definition of Done.
7. **Link, Don't Author, ADRs** — Add relevant `docs/adr/NNNN-*.md` as `back_refs` in the frontmatter. Do NOT write ADRs. If a new load-bearing decision surfaces, flag it in Questionables and recommend `grill-with-docs`.
8. **Surface Questionables** — If `QUESTIONABLE` is true, populate the Questionables section with open decisions/assumptions/risks and recommend a grilling pass (`grill-me` / `grill-with-docs`) on them. Otherwise omit the section.
9. **Set Metadata** — Fill the YAML frontmatter: `created` (now, ISO), and seed the append-only lists `modified`, `context`, `agents`, `sessions`.
10. **Save** — Write to `docs/plans/<descriptive-kebab-name>.md` and summarize the key components.
