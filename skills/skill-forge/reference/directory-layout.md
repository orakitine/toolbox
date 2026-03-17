# Skill Directory Layout Reference

Exhaustive reference of all directories and files that can appear in a skill, agent, or command.

---

## Skill Directory

```
skills/<name>/
  SKILL.md              # Required. Main instructions — the router.
  cookbook/              # Scenario-specific workflows, loaded on demand.
    javascript.md
    python.md
  reference/            # Heavy reference material, loaded by cookbooks.
    api-docs.md
    patterns.md
  templates/            # Templates for Claude to fill and output.
    task-template.md
    report-template.md
  scripts/              # Executable scripts called by the workflow.
    validate.sh
    transform.py
  tools/                # Helper executables or CLI wrappers.
    fork_terminal.sh
  prompts/              # Sub-prompts used within the skill.
    summary_prompt.md
  cache/                # Runtime data storage (caches, indexes).
    cached-doc.md
  README.md             # Recommended. Human-facing docs — NOT read by Claude during execution.
```

### What Each Directory Is For

| Directory | Loaded When | Purpose |
|---|---|---|
| `cookbook/` | Workflow routes to it | Branching logic — different workflows for different contexts |
| `reference/` | Cookbook references it | Heavy material: API docs, pattern lists, domain knowledge |
| `templates/` | Workflow uses them | Structured output formats for Claude to fill |
| `scripts/` | Workflow executes them | Deterministic operations offloaded from Claude |
| `tools/` | Workflow calls them | CLI wrappers, shell helpers |
| `prompts/` | Workflow injects them | Reusable sub-prompts for consistent behavior |
| `cache/` | Skill reads/writes | Persistent data between invocations |

### README.md — Human Discovery File

Recommended for every skill. This is the human entry point — think `--help` or a man page. NOT read by Claude during skill execution; read by humans browsing the directory and by the `skill-guide` discovery skill.

Standard sections:

```markdown
# <skill-name>

<one-line description>

## Quick Start

<simplest invocation>

## Options

<table of Variables with defaults and descriptions>

## Prerequisites

<external dependencies>

## Examples

<2-4 example prompts showing common use cases>

## Related

<family members, dependency chain>
```

### Rules

- `SKILL.md` is the only required file.
- Use `${CLAUDE_SKILL_DIR}` for all internal file references — makes skills portable.
- Cookbooks and references are **lazy-loaded** — they only consume tokens when explicitly read.
- Scripts should be executable (`chmod +x`) and have a shebang line.
- Cache directories may be `.gitignore`d if contents are generated.

---

## Agent Directory

```
agents/<name>/
  AGENT.md              # Required. Agent definition.
```

Agents are simpler — typically a single file defining the persona, constraints, and tool access.

---

## Command Directory (Legacy)

```
commands/
  command-name.md       # Single file per command
  group/                # Optional grouping
    sub-command.md
```

Commands are the legacy invocation system. Prefer skills for new work. Existing commands continue to work.
