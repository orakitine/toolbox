# Build Plan

Executes a living plan, walking its phases and tracking status in the plan file itself. Orchestrates; delegates the test-first implementation of each task to `tdd` when available.

Status markers: `[]` idle · `[wip]` in progress · `[x]` complete · `[f]` failed.

1. **Locate the Plan** — From the `USER_PROMPT`, resolve the path to the target plan in `docs/plans/`. If none is given, infer the most likely plan and confirm before building.
2. **Absorb Context (and detect a resume)** — Read the full plan: frontmatter, every back-reference (depth 1, including linked ADRs in `docs/adr/`), and the relevant `CONTEXT.md` vocabulary, so you understand the goal and prior/related work before writing code. IF the plan already carries `[wip]`/`[x]`/`[f]` markers from an earlier run → treat this as a **resume**: continue from the first task that is not `[x]` (re-verify any `[wip]` task, since it may have been interrupted mid-work) rather than restarting the plan.
3. **Execute Phases** — For each phase in order, top to bottom. **Flip markers live, as you go — not in a batch at the end.** The plan file is the durable record of progress: writing `[wip]` *before* the work and `[x]` *immediately after* means an interrupted build (crashed session, lost context, handoff to another agent) can always be resumed from the markers. Batch-updating at the end defeats this — a crash would leave every task showing `[]` despite the work being done.
   - Announce the phase you are starting.
   - Set the phase header and the current task marker to `[wip]` in the plan file *before* implementing it.
   - Implement the task's specific actions. **Delegate to `tdd`** for the test-first work: hand it the task's Testing-Strategy *behaviors* (already written as behaviors through the public interface) plus the linked ADRs and `CONTEXT.md` vocabulary, and treat the plan as the **already-approved design** — so `tdd`'s plan-and-approve step collapses to "read the approved plan and go," with no re-seeking of user approval. If `tdd` is not installed, implement the behaviors directly.
   - Run that phase's shell validation commands; loop on failure until they pass.
   - Mark each task `[x]` when complete, or `[f]` if it cannot be made to pass, then move on.
   - Do not start the next phase until the current phase's tasks and tests resolve.
4. **Final Validation** — Run the global Validation Commands and confirm every box passes. The plan is done when every box is `[x]` and all commands pass (the Definition of Done).
5. **Update Metadata** — Append the current ISO timestamp to `modified`, append agent name / session id to `agents` / `sessions`, and append the relevant commit SHA(s) to `commits`.
6. **Report** — Summarize what was built per phase, the final status of every task, and any `[f]` failures that need attention.

> **Swarm note:** if multiple agents build one plan, only the orchestrator should write status markers to the file (workers report up), or partition write-ownership by phase — concurrent writes to one file conflict. Follow the ownership model recorded in the plan's Notes.
