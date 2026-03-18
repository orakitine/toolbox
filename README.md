# Toolbox

Public collection of Claude Code skills, agents, and prompts.

Managed by [The Registry](https://github.com/orakitine/registry).

## Skills

| Skill | Description |
|-------|-------------|
| [browser](skills/browser/) | Headless browser automation via playwright-cli |
| [browser-review](skills/browser-review/) | Parallel UI validation with fan-out QA agents |
| [browser-workflow](skills/browser-workflow/) | Executes saved browser automation workflows |
| [doc-cache](skills/doc-cache/) | Transparent read-through cache for documentation lookups |
| [elevenlabs](skills/elevenlabs/) | TTS, sound effects, music generation, audio processing |
| [fork-terminal](skills/fork-terminal/) | Fork terminal sessions with CLI or agentic coding tools |
| [skill-forge](skills/skill-forge/) | Create, evaluate, and refine skills and agents |
| [skill-guide](skills/skill-guide/) | Discover and explain installed skills and agents |

## Agents

| Agent | Description |
|-------|-------------|
| [browser-operator](agents/browser-operator.md) | General-purpose browser automation, parallel-safe |
| [browser-qa](agents/browser-qa.md) | UI validation with structured pass/fail reporting |
| [elevenlabs-operator](agents/elevenlabs-operator.md) | Audio generation, parallel-safe |
| [elevenlabs-voice-designer](agents/elevenlabs-voice-designer.md) | Voice casting with audition samples |

## Usage

Register a skill from this repo:
```
/registry add <name> skill from https://github.com/orakitine/toolbox/blob/main/skills/<name>/SKILL.md
```

Pull it into any project:
```
/registry use <name>
```

## Structure

```
skills/<name>/SKILL.md     # Skill workflow + supporting files
agents/<name>.md           # Agent configurations
prompts/<name>.md          # Reusable prompts
```
