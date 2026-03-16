# Toolbox

Public collection of Claude Code skills, agents, and prompts.

Managed by [The Registry](https://github.com/orakitine/registry).

## Structure

```
skills/       # Claude Code skills (SKILL.md + supporting files)
agents/       # Agent configurations (AGENT.md + supporting files)
prompts/      # Reusable prompts
```

## Usage

Register a skill from this repo:
```
/registry add <name> skill from https://github.com/orakitine/toolbox/blob/main/skills/<name>/SKILL.md
```

Pull it into any project:
```
/registry use <name>
```
