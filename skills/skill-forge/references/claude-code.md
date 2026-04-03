# Claude Code Extensions

Harness-specific features for Claude Code. These extend the universal skill format with capabilities that other harnesses will gracefully ignore (unknown frontmatter fields are not errors).

Load this reference when creating, evaluating, or refining skills that target Claude Code specifically.

---

## Additional Frontmatter Fields

These fields are recognized by Claude Code but not part of the agentskills.io standard:

```yaml
---
# Standard fields (portable — see PRINCIPLES.md)
name: quality-gate
description: >-
  Code quality verification. Use when checking lint, types, tests,
  and build before committing.

# Claude Code extensions
allowed-tools:                      # Declare tool permissions — Claude follows as instruction
  - Read
  - Bash
  - Glob
argument-hint: "[file] [options]"   # Autocomplete hint shown to user in slash command
disable-model-invocation: false     # true = only user can invoke (for destructive ops)
user-invocable: true                # false = only Claude can invoke (background helpers)
context: fork                       # Run in isolated subagent context
agent: agent-name                   # Which agent definition to use with context:fork
model: sonnet                       # Request specific model (sonnet, opus, haiku)
---
```

**Official fields** (system-enforced by Claude Code runtime): `name`, `description`, `argument-hint`, `disable-model-invocation`, `user-invocable`.

**Prompt-pattern fields** (not system-enforced, but Claude reads and respects them as instructions): `allowed-tools`, `context`, `agent`, `model`. The distinction matters when debugging.

---

## Invocation Control

| `disable-model-invocation` | `user-invocable` | Result | Use For |
|---|---|---|---|
| `false` (default) | `true` (default) | Both user and Claude | General-purpose skills |
| `true` | `true` | User only | Side effects: commit, deploy, delete, costs money |
| `false` | `false` | Claude only | Background: doc lookup, context enrichment |

---

## Allowed-Tools Selection

Choose allowed-tools based on what the skill NEEDS, not what's convenient. Principle: least privilege.

| Skill Type | Tools |
|---|---|
| Read-only (analysis, lookup) | `Read`, `Glob`, `Grep`, `Bash` |
| Write-capable (generation, refactoring) | add `Write`, `Edit` |
| Agent-spawning (parallel work) | add `Agent`, `Task*` |
| External access (web, APIs) | add `WebFetch`, `WebSearch`, MCP tool names |

A skill that only reads code shouldn't have `Write`.

---

## Dynamic Features

| Feature | Syntax | Purpose |
|---|---|---|
| User arguments | `$ARGUMENTS`, `$0`, `$1` | Access what the user typed after the slash command |
| Skill directory | `${CLAUDE_SKILL_DIR}` | Claude Code-specific path variable (prefer relative paths for portability) |
| Shell injection | `` !`command` `` | Execute shell at prompt-load time, inject stdout before Claude sees it |

**Shell injection** runs before Claude sees the skill — not at execution time. Use for injecting dynamic context: `` !`git diff --cached` `` injects the current staged diff. Use sparingly — output consumes tokens and runs every activation.

**Portability note:** `${CLAUDE_SKILL_DIR}` only works in Claude Code. For portable skills, use relative paths (`./scripts/check.sh`). If you must use `${CLAUDE_SKILL_DIR}`, know that the skill body won't work as-is in other harnesses.

---

## Agent Composition

Claude Code supports delegating skill execution to specialized agents. This is a Claude Code orchestration feature — other harnesses may implement delegation differently.

```yaml
context: fork        # Run in isolated subagent context
agent: browser-qa    # Use this agent definition
```

When activated: spawn a subagent using the named agent definition, give it the skill's workflow as its task, run in an isolated context window, return results to the parent.

### The Three Layers

```
Agents  (.claude/agents/)    →  WHO does the work (persona, constraints, tool access)
Skills  (.claude/skills/)    →  WHAT work gets done (workflows, procedures, knowledge)
Commands (.claude/commands/)  →  Legacy invocation (merged into skills — prefer skills for new work)
```

**Separation of Concerns:**
- **Skills are generic and reusable.** A `browser` skill works across projects.
- **Agents specialize behavior.** A `browser-qa` agent adds QA-specific constraints on top of the browser skill.
- **Project-local skills encode domain knowledge.** A `critique` skill for a specific project stays in that project.

### Agent Colors

Agents support a `color` field in frontmatter for visual identification in the CLI. Available: `red`, `blue`, `green`, `yellow`, `purple`, `orange`, `pink`, `cyan`.

| Color | Role | Example |
|---|---|---|
| `green` | QA / validation | browser-qa |
| `orange` | operator / automation | browser-operator |
| `purple` | review / analysis | code-reviewer |
| `blue` | research / exploration | doc-researcher |
| `red` | destructive / deploy (caution) | deploy-agent |
| `cyan` | creative / generation | voice-designer |

### Agent Definition Format

Agent files live in `.claude/agents/<name>.md`:

```markdown
---
name: browser-qa
description: >-
  UI validation agent that executes user stories against web apps
  and reports pass/fail with screenshots. Use for QA and acceptance testing.
allowed-tools:
  - Read
  - Glob
  - Bash
color: green
---

# Role

You are a QA tester. Given a user story and a URL, you systematically
validate each acceptance criterion against the live application.

## Constraints

- NEVER modify application code or data
- ALWAYS take a screenshot before and after each action
- Report ALL failures, don't stop at the first one

## Skills

- Uses the `browser` skill for all browser automation
```

### Skill Composition via Registry

Use the registry's `requires` field (in `registry.yaml`, not SKILL.md frontmatter) to declare composition:

```yaml
- name: browser-workflow
  requires: [skill:browser]
- name: browser-review
  requires: [skill:browser, agent:browser-qa]
```

---

## Claude Code Evaluation Checklist

When evaluating skills for Claude Code compliance, check these IN ADDITION to the universal checklist:

### Frontmatter
- `allowed-tools` explicitly listed?
- Uses deprecated `trigger:` field instead of `disable-model-invocation`/`user-invocable`?
- `context: fork` set but referenced `agent:` doesn't exist?
- `argument-hint` present if skill takes arguments?
- For agents: `color` field present? Matches role convention?

### Structure
- README.md present? (Claude Code's `skill-guide` reads these for human discovery)
- README.md has standard sections? (quick start, options, examples, related)

### Distribution
- Hardcoded paths instead of `${CLAUDE_SKILL_DIR}` or relative paths?

---

## Claude Code Skill Creation Addendum

When creating skills for Claude Code, add these steps after the universal workflow:

1. **Determine Invocation Mode**
   - Has side effects (commit, deploy, delete, costs money)?
     - YES → `disable-model-invocation: true`
   - Should user be able to invoke directly?
     - NO (background helper) → `user-invocable: false`
   - Otherwise → leave defaults (both can invoke)
   - Example: quality-gate reports issues but doesn't fix them → default (both)
   - Example: commit skill pushes code → `disable-model-invocation: true`

2. **Select Allowed Tools**
   - See "Allowed-Tools Selection" above
   - Example: quality-gate only reports → `Read`, `Glob`, `Bash` (no Write)

3. **Wire Agent Composition (if applicable)**
   - IF: skill delegates to an agent → add `context: fork` and `agent: <name>` to frontmatter
   - IF: skill takes arguments → add `argument-hint: "[what-goes-here]"`

4. **Generate README.md**
   - Create a human-facing README.md next to SKILL.md
   - This is the discovery entry point — read by humans and by `skill-guide`
   - Include: skill name, one-liner, quick start, options table, prerequisites, 2-4 example prompts, related skills/agents
