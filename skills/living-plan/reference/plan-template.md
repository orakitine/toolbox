# Plan Template

Fill this Markdown template to produce a plan in `docs/plans/<kebab-name>.md`. Replace every `{{PLACEHOLDER}}`; leave no `{{}}` token behind. Duplicate every `<!-- repeat -->` block as many times as the plan needs, then delete the markers. Omit the `Questionables` section entirely unless `QUESTIONABLE` is true.

Status markers (4-state): `[]` idle · `[wip]` in progress · `[x]` complete · `[f]` failed. All start `[]`; `build-plan` advances them.

Diagrams are optional. Add a Mermaid fenced block only where it earns its place; otherwise delete the diagram comment.

---

````markdown
---
# Append-only metadata. Every field except `created` is a list that is ONLY appended to.
title: {{PLAN_TITLE}}
created: {{CREATED_ISO}}
modified: [{{MODIFIED_ISO_LIST}}]
context: [{{CONTEXT_NAMES}}]          # which CONTEXT.md context(s) this plan touches
commits: [{{COMMIT_SHA_LIST}}]
agents: [{{AGENT_NAME_LIST}}]
sessions: [{{SESSION_ID_LIST}}]
back_refs: [{{BACK_REFERENCES}}]      # plans/ADRs this builds on — e.g. docs/adr/0003-x.md, docs/plans/y.md
forward_refs: [{{FORWARD_REFERENCES}}] # plans that build on this
---

# Plan: {{PLAN_TITLE}}

## Purpose

{{PURPOSE}}

> **Definition of Done:** this plan is complete when every box below is `[x]` and the global Validation Commands pass. The Purpose + those commands are the fixed goal — changing them requires an Amendments entry.

## Problem

{{PROBLEM}}

<!-- optional: a Mermaid diagram of the problem, only if it clarifies -->

## Solution

{{SOLUTION}}

<!-- optional Mermaid diagram of the proposed architecture/flow:
```mermaid
{{SOLUTION_DIAGRAM}}
```
-->

## Relevant Files

### Existing Files
<!-- repeat -->
- `{{EXISTING_FILE_PATH}}` — {{WHY_RELEVANT}}

### New Files
<!-- repeat -->
- `{{NEW_FILE_PATH}}` — {{WHY_NEEDED}}

## Implementation Phases

**IMPORTANT:** Execute every phase and task step by step, in order, top to bottom.

<!-- repeat: one block per phase -->
### `[]` Phase {{PHASE_NUMBER}}: {{PHASE_NAME}}

{{PHASE_DESCRIPTION}}

<!-- optional per-phase Mermaid diagram -->

#### {{TASK_NUMBER}}. {{TASK_NAME}}
<!-- repeat: one checklist item per specific action -->
- `[]` {{SPECIFIC_ACTION}}

#### {{LAST_TASK_NUMBER}}. Testing Strategy

Behaviors to verify through the public interface (this is what `tdd` consumes — describe *what the system does*, not how):
<!-- repeat -->
- `[]` {{BEHAVIOR}} — verified by {{HOW}}

Shell validation for this phase:
<!-- repeat -->
- `[]` `{{VALIDATION_COMMAND}}` — {{WHAT_IT_PROVES}}

🔁 **Do not exit this phase until every box above is checked.** If a command fails, fix the cause and re-run — loop until all pass.

## Validation Commands

Run these to validate the entire plan is complete:
<!-- repeat -->
- `[]` `{{VALIDATION_COMMAND}}` — {{WHAT_IT_PROVES}}

🔁 **The plan is not complete until every box is checked and every command passes.** If a step is genuinely impossible, mark it `[f]`, record why in Notes, and move on.

## Questionables
<!-- Include this section ONLY if QUESTIONABLE is true. -->
<!-- Open decisions, assumptions, and risks. Load-bearing decisions here should be
     resolved via grill-with-docs (which writes the ADR); routine ones just get decided. -->
<!-- repeat -->
- **{{QUESTIONABLE}}** — {{ASSUMPTION_OR_RATIONALE}}

## Notes

{{NOTES}}
<!-- Free-form canvas. Capture context, dependencies, tradeoffs, rejected approaches,
     risks, future work, references, and (for swarm execution) the write-ownership model.
     Use prose, lists, tables, code blocks, or Mermaid as the plan benefits. -->

## Amendments
<!-- Append-only history of changes made AFTER the plan was first authored.
     Populated by update-plan and update-references; newest at the bottom.
     A change to Purpose or Definition of Done MUST be logged here with rationale. -->
<!-- repeat -->
- **{{AMEND_ISO}} — {{AMEND_SUMMARY}}**: {{AMEND_DETAIL}}
````
