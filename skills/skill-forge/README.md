# skill-forge

Creates, evaluates, and refines Claude Code skills, agents, and commands.

## Quick Start

```
/skill-forge create browser
```

## Options

No configurable variables. Behavior is determined by mode (create, evaluate, refine) and the skill/agent name passed as argument.

## Prerequisites

No external dependencies. Works with any Claude Code installation.

## Modes

| Mode | Trigger Keywords | Description |
|---|---|---|
| Create | create, new, build | Build a new skill or agent from scratch |
| Evaluate | evaluate, audit, review, check | Run quality checklist against an existing skill |
| Refine | refine, rewrite, modernize, clean up, improve, migrate | Understand, rewrite, validate, compare an existing skill |

## Evaluate Modes

| Invocation | Behavior |
|---|---|
| `/skill-forge evaluate <name>` | Independent review — spawns a fresh agent for unbiased evaluation |
| `/skill-forge evaluate <name> inline` | Quick check in main context — allows interactive discussion |

## What It Checks (Evaluate)

- Frontmatter: description, allowed-tools, naming, deprecated fields
- Structure: line count, forbidden sections, duplication, portability
- Variables: comments, casing, single-use
- Workflow: bold names, numbering, inline examples, IF/THEN format
- Cookbooks: cross-references, abstraction levels, purpose statements
- Distribution: secrets, hardcoded paths, project assumptions
- README.md: presence and standard sections

## Reference Files

| File | Purpose |
|---|---|
| reference/PRINCIPLES.md | The WHY — conventions, patterns, anti-patterns |
| reference/directory-layout.md | Exhaustive skill/agent directory structure |

## Examples

- "build a new skill for docker container management"
- "evaluate all skills in ~/.claude/skills/"
- "modernize the old doc-vault skill"
- "create an agent for security code review"

## Related

Standalone meta-skill. No dependencies on other skills.
