# Skill Directory Layout Reference

Exhaustive reference of all directories and files that can appear in a skill. Based on the [agentskills.io specification](https://agentskills.io/specification) with notes on harness-specific extensions.

---

## Universal Skill Directory

This is the standard layout recognized by all compliant agent harnesses:

```
<name>/
  SKILL.md              # Required. Frontmatter + instructions.
  scripts/              # Optional. Executable code called by the workflow.
    validate.sh
    transform.py
  references/           # Optional. Additional docs, scenario-specific guides.
    javascript.md
    api-docs.md
  assets/               # Optional. Templates, data files, images.
    report-template.md
    config.json
```

### What Each Directory Is For

| Directory | Loaded When | Purpose |
|---|---|---|
| `scripts/` | Workflow executes them | Deterministic operations offloaded from the model |
| `references/` | Workflow routes to them | Scenario-specific guides, heavy docs, domain knowledge |
| `assets/` | Workflow uses them | Templates, data files, static resources |

### Rules

- `SKILL.md` is the only required file.
- Use relative paths from skill root (`./scripts/check.sh`) for all internal references.
- References and scripts are **lazy-loaded** — they only consume tokens when explicitly read.
- Scripts should be executable (`chmod +x`) and have a shebang line.
- The directory name MUST match the `name` field in frontmatter.
- Keep nesting shallow — references shouldn't chain to other references.

---

## Discovery Paths

Where harnesses scan for skills:

| Scope | Path | Purpose |
|---|---|---|
| Project (interop) | `<project>/.agents/skills/` | Cross-client — any compliant harness finds these |
| Project (client) | `<project>/.<client>/skills/` | Client-specific (e.g., `.claude/skills/`) |
| User (interop) | `~/.agents/skills/` | Cross-client, user-level |
| User (client) | `~/.<client>/skills/` | Client-specific, user-level |

For maximum portability, prefer `.agents/skills/`. Use client-specific paths only when the skill genuinely depends on harness features.

---

## Harness-Specific Extensions

Individual harnesses may support additional directories or files. These are ignored by other harnesses.

### Claude Code

Claude Code recognizes additional directories and concepts beyond the universal layout:

```
<name>/
  SKILL.md              # Standard
  scripts/              # Standard
  references/           # Standard
  assets/               # Standard
  tools/                # CC extension: CLI wrappers, shell helpers
    fork_terminal.sh
  prompts/              # CC extension: reusable sub-prompts
    summary_prompt.md
  cache/                # CC extension: runtime data storage between invocations
    cached-doc.md
  README.md             # CC convention: human-facing docs for skill-guide discovery
```

| Directory | Purpose |
|---|---|
| `tools/` | CLI wrappers and shell helpers called by the workflow |
| `prompts/` | Reusable sub-prompts for consistent behavior |
| `cache/` | Persistent data between invocations (may be `.gitignore`d) |

**README.md** is a Claude Code convention for human discovery — read by humans browsing the directory and by the `skill-guide` skill. Standard sections: skill name, one-liner, quick start, options, prerequisites, examples, related skills.

Claude Code also has **agents** (`.claude/agents/<name>.md`) and **commands** (`.claude/commands/`, legacy — prefer skills). These are covered when claude-code.md is pre-loaded by SKILL.md.
