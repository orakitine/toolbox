# Skill Creation Principles

The WHY and conventions behind Claude Code skills, agents, and commands. This is reference material — for step-by-step creation workflows, see the skill-forge cookbooks. For the full directory layout, see `reference/directory-layout.md`.

**Skills** are workflows and procedures (the WHAT). **Agents** are specialized personas (the WHO). **Commands** are legacy (prefer skills for new work).

**Last Updated**: 2026-03-17

---

## Core Principles

### 1. Single Source of Truth

Every piece of information exists in exactly ONE place.

- Workflow contains all procedural steps (with inline examples)
- Variables contain all configuration (with inline comments)
- Cookbooks contain scenario-specific detail (not duplicated in SKILL.md)
- Edit once, done. No synchronization needed.

### 2. Progressive Disclosure

SKILL.md is a router, not a manual. Structure information in layers:

- **Layer 0 — Frontmatter** (~100 tokens): Loaded at startup for every installed skill. This is your elevator pitch.
- **Layer 1 — SKILL.md body** (target: <300 lines): Loaded when the skill activates. Contains the workflow and cookbook routing.
- **Layer 2 — Cookbooks, references, scripts** (unlimited): Loaded on demand when a workflow step routes to them.

Only load what's needed, when it's needed.

### 3. Lean = No Duplication

Lean means zero duplication, NOT minimal lines.

A 50-line cookbook with clear examples is leaner than a 20-line cookbook that requires guessing. Optimize for clarity and maintainability. Don't optimize for line count at clarity's expense.

### 4. Readability for Humans and AI

- **Bold step names** for scannability (~1 token cost, large UX win)
- Inline examples showing expected behavior immediately
- Consistent formatting reducing cognitive load
- Clear structure enabling quick navigation

### 5. One Skill, One Level of Abstraction

A skill should do one thing at one level of abstraction. If skill B consumes skill A, they are separate skills — not cookbooks within A.

**Cookbooks** are for different scenarios at the SAME level of abstraction:
- `quality-gate/cookbook/javascript.md` vs `quality-gate/cookbook/python.md` — same task, different context

**Separate skills** are for different levels of abstraction that compose together:
- `browser` — drives a browser (low-level capability)
- `browser-workflow` — loads and runs saved workflows through browser (orchestration)
- `browser-review` — discovers stories, fans out QA agents, aggregates results (parallel orchestration)

The test: does this cookbook share the parent's core workflow steps, or does it define its own independent workflow? Shared steps = cookbook. Own workflow = separate skill.

Use the registry's `requires` field (a registry-level field in `registry.yaml`, not SKILL.md frontmatter) to declare composition:
```yaml
- name: browser-workflow
  requires: [skill:browser]
- name: browser-review
  requires: [skill:browser, agent:browser-qa]
```

---

## Architecture

### The Three Layers

```
Agents  (.claude/agents/)    →  WHO does the work (persona, constraints, tool access)
Skills  (.claude/skills/)    →  WHAT work gets done (workflows, procedures, knowledge)
Commands (.claude/commands/)  →  Legacy invocation (merged into skills — prefer skills for new work)
```

### How They Compose

A skill can delegate to an agent via frontmatter:

```yaml
context: fork        # Run in isolated subagent context
agent: browser-qa    # Use this agent definition
```

When activated: spawn a subagent using the named agent definition, give it the skill's workflow as its task, run in an isolated context window, return results to the parent.

### Separation of Concerns

- **Skills are generic and reusable.** A `browser` skill works across projects.
- **Agents specialize behavior.** A `browser-qa` agent adds QA-specific constraints on top of the browser skill.
- **Project-local skills encode domain knowledge.** A `critique` skill for a children's book project stays in that project.

---

## Token Economics

### How Skill Loading Works

1. **Startup**: ~100 tokens of metadata (name + description) loads per installed skill.
2. **Discovery budget**: All metadata shares ~2% of context window (~16K chars). Too many verbose descriptions = some skills excluded.
3. **Activation**: Full SKILL.md loads when skill is triggered.
4. **Cookbook loading**: Only when the workflow explicitly routes to one.

### Practical Implications

- The `description` field is the most important line in the skill. Write it like a search snippet — specific trigger words, clear purpose, when to use it. Specific descriptions dramatically improve activation accuracy.
- Keep SKILL.md body under ~300 lines (guideline, not a hard limit — prefer clarity over hitting the number). Heavy detail goes in cookbooks.
- Cookbooks are free until loaded. A skill with 5 cookbooks that loads 1 at a time beats a monolithic SKILL.md.

---

## Naming Conventions

### Core Rule: Name the Capability, Not the Implementation

The name should survive a tool swap. `browser` works if you swap Playwright for Puppeteer. `playwright-browser` doesn't.

### Patterns

| Asset Type | Pattern | Examples |
|---|---|---|
| Skill | `<capability>` | `browser`, `doc-vault`, `quality-gate` |
| Agent | `<capability>-<role>` | `browser-qa`, `browser-automation`, `voice-designer` |
| Cookbook | `<context>.md` | `javascript.md`, `python.md`, `nextjs.md` |
| Project-local skill | `<domain-action>` | `critique`, `illustrate`, `validate` |

### Family Prefixes for Discovery

Related assets share a prefix so searching by prefix finds the whole family. A `browser` skill has agents named `browser-qa`, `browser-automation` — all discoverable by prefix.

### Description: The 100-Token Pitch

Write in **third person**. Include WHAT it does AND WHEN to use it. Use specific trigger words.

```yaml
# Bad
description: Helps with browser stuff

# Good
description: Headless browser automation for testing, screenshots, scraping, and parallel sessions. Use for UI validation, web scraping, or browser-based workflows.
```

---

## Conventions

### Frontmatter Fields

**Official fields** (system-enforced by Claude Code runtime):

```yaml
---
name: skill-name                    # Max 64 chars, lowercase + hyphens. Defaults to dir name.
description: >-                     # CRITICAL. Max 1024 chars, third person. WHAT + WHEN.
  Headless browser automation for
  testing, screenshots, and scraping.
argument-hint: "[file] [options]"   # Autocomplete hint shown to user
disable-model-invocation: false     # true = only user can invoke (destructive ops)
user-invocable: true                # false = only Claude can invoke (background helpers)
---
```

**Prompt-pattern fields** (not system-enforced, but Claude reads and respects them as instructions in the markdown context — same mechanism as Variables):

```yaml
allowed-tools:                      # Declare tool permissions — Claude follows as instruction
  - Read
  - Bash
  - Glob
context: fork                       # Signal to run in isolated subagent
agent: agent-name                   # Which agent to use with context:fork
model: sonnet                       # Request specific model
```

Both types go in the YAML frontmatter. The distinction matters when debugging: official fields are enforced by the runtime, prompt-pattern fields rely on Claude reading and following the instruction.

### Invocation Control

| `disable-model-invocation` | `user-invocable` | Result | Use For |
|---|---|---|---|
| `false` (default) | `true` (default) | Both user and Claude | General-purpose skills |
| `true` | `true` | User only | Side effects: commit, deploy, delete, costs money |
| `false` | `false` | Claude only | Background: doc lookup, context enrichment |

### Allowed-Tools Selection

Choose allowed-tools based on what the skill NEEDS, not what's convenient:

- **Read-only skills** (analysis, lookup): `Read`, `Glob`, `Grep`, `Bash`
- **Write-capable skills** (generation, refactoring): add `Write`, `Edit`
- **Agent-spawning skills** (parallel work): add `Agent`, `Task*`
- **External access** (web, APIs): add `WebFetch`, `WebSearch`, MCP tool names

Principle: least privilege. A skill that only reads code shouldn't have `Write`.

### Dynamic Features

| Feature | Syntax | Purpose |
|---|---|---|
| User arguments | `$ARGUMENTS`, `$0`, `$1` | Access what the user typed after the slash command |
| Skill directory | `${CLAUDE_SKILL_DIR}` | Portable file references — use this instead of hardcoded paths |
| Shell injection | `` !`command` `` | Execute shell command and inject stdout into the prompt before delivery |

**Shell injection** runs at prompt-load time, before Claude sees the skill. Use for injecting dynamic context: `` !`git diff --cached` `` injects the current staged diff. Use sparingly — the output consumes tokens and runs every time the skill loads.

### Variables: The Local Vocabulary Pattern

Variables are a **prompt engineering pattern**, not a system feature. Claude parses them as markdown and holds them in context. They provide:

1. **Named constants** — reference throughout without repeating values
2. **Configuration surface** — change behavior by editing one line
3. **Semantic context** — name says what it is, comment says what it's for

Format:
```markdown
## Variables

CACHE_DIR: .claude/skills/doc-vault/cache    # Where cached docs are stored
OUTPUT_MODE: display                          # Options: display, save, both
ENABLE_JAVASCRIPT: true                       # Enable JavaScript/TypeScript checks
```

Rules: one per line, SCREAMING_SNAKE_CASE, inline comment on same line. Only genuinely configurable values. If a value appears once and is self-explanatory, just inline it.

### Workflow Steps

Every step follows this anatomy:

```markdown
1. **Step Name**
   - Action to perform
   - IF: <condition> → THEN <action>
   - Example: "input" → Expected output
   - Tool: Specific tool with parameters
```

Rules: bold step names, numbered list, inline example in every step, IF/THEN for conditionals, specific tool references with parameters.

### Cookbook Routing

```markdown
## Cookbook

### Scenario Name

- IF: Condition that triggers this cookbook
- THEN: Read and execute `${CLAUDE_SKILL_DIR}/cookbook/file-name.md`
- EXAMPLES:
  - "example user request 1"
  - "example user request 2"
```

---

## Portability

### Reusable vs. Project-Local

| Reusable skill | Project-local skill |
|---|---|
| Generic, works across projects | Domain-specific knowledge |
| No hardcoded project paths | Project-specific workflows |
| No secrets or credentials | Personal systems (GTD, etc.) |
| Uses `${CLAUDE_SKILL_DIR}` for file refs | Can use absolute paths if needed |

### Versioning

Git history is the version system. To roll back: `git log`, checkout the previous version.

---

## Anti-Patterns

### Structure
- **Monolithic SKILL.md** — Over 300 lines? Break it into cookbooks.
- **Deep nesting** — Cookbooks shouldn't reference other cookbooks. One level deep from SKILL.md.
- **Duplication** — Same info in two places means one will rot.
- **Forbidden sections** — Quick Reference, separate Examples, Notes, Instructions, Success Criteria. These duplicate what belongs inline in workflow steps or variable comments.
- **Omni-skills** — A skill that orchestrates AND does the low-level work. Split by abstraction level.

### Content
- **Teaching Claude what it knows** — Don't explain `git`. Do explain your specific workflow.
- **Vague steps** — "Process the files" = bad. "Run `eslint --format json` on `*.ts` files" = good.
- **Missing examples** — Every workflow step needs an inline example.
- **Time-sensitive info** — "Latest version is 4.2" will rot. Link to docs.

### Naming
- **Implementation in name** — `playwright-browser` instead of `browser`
- **Generic words alone** — `helper`, `utils`, `tools`

### Distribution
- **Hardcoded paths** — Use `${CLAUDE_SKILL_DIR}` for portability.
- **Secrets in skills** — No API keys, tokens, or credentials.
- **Project assumptions** — Toolbox skills must work without project-specific context.
