# skill-forge

Creates, evaluates, and refines agent skills following the [agentskills.io specification](https://agentskills.io/specification). Produces portable skills that work across any compliant agent harness.

## Quick Start

```
/skill-forge create browser
```

## Options

No configurable variables. Behavior is determined by mode (create, evaluate, refine) and the skill/agent name passed as argument.

## Prerequisites

No external dependencies. Works with any agent harness that supports skills.

## Modes

| Mode | Trigger Keywords | Description |
|---|---|---|
| Create | create, new, build | Build a new skill from scratch |
| Evaluate | evaluate, audit, review, check | Run quality checklist against an existing skill |
| Refine | refine, rewrite, modernize, clean up, improve, migrate | Understand, rewrite, validate, compare an existing skill |

## Evaluate Modes

| Invocation | Behavior |
|---|---|
| `/skill-forge evaluate <name>` | Independent review — spawns a fresh agent for unbiased evaluation |
| `/skill-forge evaluate <name> inline` | Quick check in main context — allows interactive discussion |

## What It Checks (Evaluate)

- Frontmatter: name, description, naming rules (agentskills.io spec compliance)
- Structure: line count, forbidden sections, duplication, portability
- Variables: comments, casing, single-use
- Workflow: bold names, numbering, inline examples, IF/THEN format
- References: cross-references, abstraction levels, purpose statements
- Portability: relative paths, harness-specific leaks, secrets, project assumptions
- Harness-specific: additional checks when skill targets a specific harness (e.g., Claude Code allowed-tools, agent wiring)

## Reference Files

| File | Purpose |
|---|---|
| references/PRINCIPLES.md | Universal principles — conventions, patterns, anti-patterns |
| references/directory-layout.md | Skill directory structure (universal + harness-specific) |
| references/claude-code.md | Claude Code-specific extensions and conventions |
| references/create-skill.md | Skill creation workflow |
| references/create-agent.md | Agent creation workflow (Claude Code) |
| references/evaluate.md | Evaluation checklist |
| references/refine.md | Refinement workflow |

## Examples

- "build a new skill for docker container management"
- "evaluate all skills in ~/.agents/skills/"
- "modernize the old doc-vault skill"
- "create an agent for security code review" (Claude Code)
- "make this skill portable across harnesses"
- "refine this skill for the agentskills.io spec"

## Related

Standalone meta-skill. No dependencies on other skills.
