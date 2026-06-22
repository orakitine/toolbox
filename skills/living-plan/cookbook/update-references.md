# Update References

Refreshes plan metadata and links plans to other plans and to ADRs.

1. **Identify the Plan** — From the `USER_PROMPT`, locate the target `.md` plan in `docs/plans/`.
2. **Identify Related Work** — Determine the other plan(s) in `docs/plans/` and/or decision record(s) in `docs/adr/`, and the link direction:
   - **back reference** — work this plan builds on or depends on (including the ADRs it respects)
   - **forward reference** — work that builds on or extends this plan
3. **Update This Plan** — Edit the frontmatter, adding the relative path + short label to `back_refs` or `forward_refs` without duplicating an existing reference. ADR links are back-references (this skill links ADRs; it never writes them).
4. **Update the Other Side** — For each related *plan*, add the reciprocal reference so plan↔plan links stay bidirectional. (ADRs are not edited here.) Append the current ISO timestamp to `modified` on every plan touched.
5. **Record Amendment** — Append an Amendments entry to each plan touched (newest at the bottom) noting the references added.
6. **Report** — List each plan touched and the references added in each direction.
