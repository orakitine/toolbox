# skill-guide

Discovers and explains installed skills and agents. Your toolbox's table of contents.

## Quick Start

```
/skill-guide
```

## Options

| Variable | Default | Description |
|---|---|---|
| GLOBAL_SKILLS_DIR | ~/.claude/skills | Where global skills are installed |
| GLOBAL_AGENTS_DIR | ~/.claude/agents | Where global agents are installed |
| PROJECT_SKILLS_DIR | .claude/skills | Where project-level skills are installed |
| PROJECT_AGENTS_DIR | .claude/agents | Where project-level agents are installed |
| REGISTRY_YAML | ~/.claude/skills/registry/registry.yaml | Registry catalog for dependency info |

## Prerequisites

No external dependencies. Works with any Claude Code installation.

## Modes

| Mode | Trigger | Description |
|---|---|---|
| Inventory | `/skill-guide` (no args) | List all installed skills and agents grouped by family |
| Detail | `/skill-guide browser` | Deep dive on a specific skill or family |
| Recommend | `/skill-guide how do I test my UI` | Match a task to the best available skills |

## Examples

- `/skill-guide` — "what's available to me?"
- `/skill-guide browser` — "tell me about the browser family"
- `/skill-guide browser-qa` — "what does this agent do?"
- `/skill-guide how do I automate forms` — "which skill should I use?"

## Related

Companion to **skill-forge** (create/evaluate/refine skills). skill-guide discovers, skill-forge builds.
