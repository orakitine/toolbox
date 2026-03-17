# Toolbox

## What This Is

Public repo of stable Claude Code skills, agents, and prompts. The **single source of truth** that the registry (`~/.claude/skills/registry/`) points at.

- **Repo**: https://github.com/orakitine/toolbox.git
- **Local**: ~/Documents/toolbox
- **Registry**: https://github.com/orakitine/registry.git (installed at ~/.claude/skills/registry/)

## Companion Repos

- **registry** (`~/.claude/skills/registry/`) — catalog of pointers to skills. `/registry add` registers skills from this repo.
- **claude-code-lab** — experimentation/prototyping. Skills graduate from lab → toolbox when stable.
- **toolbox-private** (planned) — same structure, private repo for sensitive skills.

## Workflow

1. Prototype skills in `claude-code-lab`
2. Graduate stable skills here under `skills/<name>/SKILL.md`
3. Register them: `/registry add <name> skill from https://github.com/orakitine/toolbox/blob/main/skills/<name>/SKILL.md`
4. Use anywhere: `/registry use <name>`

## Structure

```
skills/<name>/SKILL.md          # Each skill gets its own directory
  cookbook/                      # Scenario-specific workflows
  reference/                    # Heavy reference material
  scripts/                      # Executable helpers
agents/<name>/AGENT.md          # Agent configurations
prompts/<name>.md               # Reusable prompts
staging/                        # Work-in-progress before graduation
```

## Graduated Skills

- **skill-forge** — Meta-skill for creating, evaluating, and refining skills, agents, and commands. Includes creation principles, directory layout reference, and evaluation workflow.
- **browser** — Headless browser automation via playwright-cli. Core capability skill.
- **browser-workflow** — Loads and executes saved browser automation workflows through the browser skill.
- **browser-review** — Parallel UI validation. Discovers user stories, fans out browser-qa agents, aggregates pass/fail results.

## Graduated Agents

- **browser-operator** — General-purpose browser automation agent. Enables parallel browser sessions when spawned as subagent.
- **browser-qa** — UI validation agent. Executes user stories against web apps with structured pass/fail reporting and screenshots.

## Staging

Skills pulled from across devices (Mac global, Linux box, claude-code-lab) live in `staging/` until reviewed, renamed, and graduated into `skills/`.

## Next Steps

- Review and rename staged skills (browser, doc-vault, quality-gate, etc.)
- Graduate them into skills/
- Register each one via /registry add
- Test the full flow: add → use → push → sync
