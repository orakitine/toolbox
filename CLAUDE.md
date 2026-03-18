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
agents/<name>.md                # Agent configurations
prompts/<name>.md               # Reusable prompts
```

## Skills

- **browser** — Headless browser automation via playwright-cli. Core capability skill.
- **browser-review** — Parallel UI validation. Discovers user stories, fans out browser-qa agents, aggregates pass/fail results.
- **browser-workflow** — Loads and executes saved browser automation workflows through the browser skill.
- **doc-cache** — Transparent read-through cache for documentation lookups with expiration and garbage collection.
- **elevenlabs** — TTS, sound effects, music generation, audio processing via ElevenLabs API. Bundled Python CLI.
- **fork-terminal** — Fork a terminal session to a new window with a command or agentic coding tool. Supports context handoff.
- **skill-forge** — Meta-skill for creating, evaluating, and refining skills, agents, and commands.
- **skill-guide** — Discovers and explains installed skills/agents. Inventory, detail, and recommend modes.

## Agents

- **browser-operator** — General-purpose browser automation agent. Parallel-safe.
- **browser-qa** — UI validation agent. Structured pass/fail reporting with screenshots.
- **elevenlabs-operator** — Audio generation agent. Parallel-safe.
- **elevenlabs-voice-designer** — Voice casting agent. Audition samples with structured recommendations.
