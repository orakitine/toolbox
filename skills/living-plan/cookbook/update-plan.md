# Update Plan

Surgically revises the content of an existing living plan.

1. **Identify the Plan** — From the `USER_PROMPT`, locate the target `.md` plan in `docs/plans/`. If ambiguous, infer the most likely one and confirm before editing.
2. **Scope the Change** — THINK HARD about exactly what the prompt asks to change, extend, or revise. Keep the edit surgical; touch only the affected sections.
3. **Guard the Goal** — If the change touches `Purpose` or the global `Validation Commands` (the Definition of Done), treat it as moving the goalpost: make the change deliberately, and you MUST log it in Amendments with rationale. Recommend a re-grill, and `grill-with-docs` if the shift rests on a new load-bearing decision (which becomes an ADR there, not here). Progress/status updates need no such ceremony.
4. **Apply the Change** — Edit the relevant sections in place, preserving structure, the 4-state markers, and `{{}}`-derived conventions. Keep the domain vocabulary consistent with `CONTEXT.md`.
5. **Update Metadata** — Append the current ISO timestamp to `modified`, and append the agent name / session id to `agents` / `sessions`. Never overwrite existing entries.
6. **Record Amendment** — Append a new Amendments entry (newest at the bottom) summarizing what changed and why.
7. **Report** — Summarize the change made and the amendment recorded.
