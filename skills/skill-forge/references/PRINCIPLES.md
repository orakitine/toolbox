# Skill Creation Principles

The WHY and conventions behind agent skills — portable, harness-agnostic instruction packages that any compliant agent can discover and execute. This is reference material — for step-by-step creation workflows, see the skill-forge references.

Aligned with [agentskills.io/specification](https://agentskills.io/specification) — the open standard for portable agent skills. Harness-specific extensions (Claude Code, Pi, etc.) live in dedicated reference files, not here.

**Last Updated**: 2026-04-02

---

## Core Principles

These principles are universal — they apply regardless of which agent harness loads the skill.

### 1. Design for the Model, Not the Harness

Skills are consumed by language models, not by runtimes. A SKILL.md is a structured document that an LLM reads, understands, and follows. The harness (Claude Code, Pi, Cursor, Goose, Kiro...) is just the delivery mechanism — it discovers the file, loads it into context, and gets out of the way.

**Implications:**
- The SKILL.md body should work regardless of which harness loads it
- Harness-specific features belong in frontmatter where they degrade gracefully — unknown fields are ignored, not errors
- Use relative paths from skill root (`./scripts/check.sh`), not harness-specific variables
- Write instructions as clear markdown any LLM can follow, not as harness-specific DSL
- Place skills in `.agents/skills/` for cross-client discovery (the widely adopted interop convention)

Think progressive enhancement: portable core that works everywhere, harness-specific features that activate where supported and are silently ignored elsewhere.

### 2. Single Source of Truth

Every piece of information exists in exactly ONE place.

- Workflow contains all procedural steps (with inline examples)
- Variables contain all configuration (with inline comments)
- References contain scenario-specific detail (not duplicated in SKILL.md)
- Edit once, done. No synchronization needed.

### 3. Progressive Disclosure

SKILL.md is a router, not a manual. Structure information in layers:

- **Layer 0 — Frontmatter** (~100 tokens): Loaded at startup for every installed skill. This is your elevator pitch.
- **Layer 1 — SKILL.md body** (target: <500 lines / <5000 tokens): Loaded when the skill activates. Contains the workflow and routing to deeper resources.
- **Layer 2 — References, scripts, assets** (unlimited): Loaded on demand when a workflow step routes to them.

Only load what's needed, when it's needed.

### 4. Lean = No Duplication

Lean means zero duplication, NOT minimal lines.

A 50-line reference doc with clear examples is leaner than a 20-line one that requires guessing. Optimize for clarity and maintainability. Don't optimize for line count at clarity's expense.

### 5. Readability for Humans and AI

SKILL.md serves both audiences. It's markdown — humans can read it, models can follow it.

- Bold step names for scannability
- Inline examples in every step
- Consistent formatting throughout
- Step-by-step procedures, not abstract declarations

### 6. One Skill, One Level of Abstraction

A skill should do one thing at one level of abstraction. If skill B consumes skill A, they are separate skills — not references within A.

**Same-level variants** are for different scenarios at the SAME abstraction level:
- `quality-gate/references/javascript.md` vs `quality-gate/references/python.md` — same task, different context

**Separate skills** are for different levels of abstraction that compose together:
- `browser` — drives a browser (low-level capability)
- `browser-workflow` — loads and runs saved workflows through browser (orchestration)
- `browser-review` — discovers stories, fans out QA agents, aggregates results (parallel orchestration)

The test: does this reference share the parent's core workflow steps, or does it define its own independent workflow? Shared steps = reference. Own workflow = separate skill.

### 7. Procedures Over Declarations

Teach HOW to approach a class of problems, not WHAT to produce for a specific instance. A skill that says "run eslint, fix errors, re-run until clean" is more durable than one that says "output must have zero lint errors." The procedure adapts to novel situations; the declaration only covers the exact case it was written for.

### 8. Defaults, Not Menus

Pick a default tool or approach. Mention alternatives briefly. Don't present a buffet of equally weighted options — that pushes the decision onto the model and increases inconsistency.

```markdown
# Good — clear default
Run checks with `eslint`. For projects using Biome, substitute `biome check`.

# Bad — decision menu
Choose one of: eslint, biome, oxlint, or prettier. Consider project config...
```

### 9. Match Specificity to Fragility

Give the model freedom for flexible tasks. Be prescriptive for fragile operations.

- **Flexible** (writing a README): light guidance, let the model adapt
- **Fragile** (database migration, deployment): exact commands, validation gates, explicit rollback steps

### 10. Start from Real Expertise

Don't generate skills from generic knowledge. Extract from hands-on tasks:

- Note steps that worked and corrections made during real execution
- Synthesize from project artifacts: runbooks, API specs, code review comments, failure cases
- Run against real tasks, read execution traces, iterate — even one execute-then-revise pass improves quality dramatically

A skill that hasn't been tested against real work is a hypothesis, not a procedure.

---

## Portable Skill Format

This section follows the [agentskills.io specification](https://agentskills.io/specification). Skills built to this format work across any compliant agent harness.

### Directory Structure

```
my-skill/
├── SKILL.md        # Required: frontmatter + instructions
├── scripts/        # Optional: executable code
├── references/     # Optional: additional docs, scenario-specific guides
└── assets/         # Optional: templates, data files, images
```

The directory name MUST match the `name` field in frontmatter.

### SKILL.md Format

YAML frontmatter between `---` delimiters, followed by markdown body.

**Standard fields** (recognized by all compliant harnesses):

```yaml
---
name: skill-name                    # Required. Max 64 chars. Lowercase letters, numbers, hyphens.
description: >-                     # Required. Max 1024 chars. WHAT it does + WHEN to use it.
  Code quality verification for lint,
  types, tests, and build. Use when
  checking code before committing.
license: MIT                        # Optional. License name or reference.
compatibility: >-                   # Optional. Max 500 chars. Environment requirements.
  Node.js >= 18, eslint installed.
metadata:                           # Optional. Arbitrary key-value pairs.
  author: your-name
  version: "1.0"
---
```

### Writing Effective Descriptions

The description carries the entire burden of triggering. It determines whether a harness loads your skill.

- **Hybrid voice**: Third-person WHAT + imperative WHEN
- Include specific trigger words that match how users phrase requests
- Err on the side of listing contexts where the skill applies

```yaml
# Bad
description: Helps with browser stuff

# Good
description: >-
  Headless browser automation for testing, screenshots,
  scraping, and parallel sessions. Use when driving browsers,
  capturing screenshots, or running browser-based workflows.
```

### File References

Use relative paths from skill root. Keep one level deep — references shouldn't chain to other references.

```markdown
# Portable — works in any harness
Read and execute `./scripts/check.sh`
See `./references/javascript.md` for JS-specific steps.

# Non-portable — harness-specific variable
Read `${CLAUDE_SKILL_DIR}/scripts/check.sh`
```

### Scripts

Bundle reusable logic in `scripts/`. Design for agentic use:

- **No interactive prompts.** Agents can't respond to TTY input. Accept all input via CLI flags, env vars, or stdin.
- **Include `--help`.** Brief description, flags, usage examples.
- **Structured output.** JSON/CSV on stdout, diagnostics on stderr.
- **Idempotent.** Agents may retry. Running twice should be safe.
- **Safe defaults.** Require `--confirm` for destructive operations. Support `--dry-run`.
- **Meaningful exit codes.** Document them in `--help`.
- **Predictable output size.** Default to summary. Support `--offset`/`--limit` for large output.
- **Self-contained dependencies.** Use inline dependency declarations where the language supports it (PEP 723 for Python/uv, Deno, Bun).

### Useful Instruction Patterns

These patterns work across any harness because they're just well-structured markdown:

- **Gotchas sections** — Environment-specific facts that defy assumptions. Keep in SKILL.md. Add corrections iteratively as you discover them.
- **Validation loops** — Do work → run validator → fix issues → repeat until passing.
- **Plan-validate-execute** — For batch or destructive operations: create plan, validate against source of truth, then execute.
- **Checklists** — Multi-step workflows with explicit progress tracking and validation gates.
- **Templates** — Concrete output structure in `assets/`. Agents pattern-match well against examples.

### Skill Discovery Paths

Harnesses scan these directories for skills:

| Scope | Path | Purpose |
|---|---|---|
| Project (interop) | `<project>/.agents/skills/` | Cross-client, any harness finds these |
| Project (client-specific) | `<project>/.<client>/skills/` | Only that client finds these |
| User (interop) | `~/.agents/skills/` | Cross-client, user-level |
| User (client-specific) | `~/.<client>/skills/` | Only that client, user-level |

For maximum portability, prefer `.agents/skills/`. Use client-specific paths only when the skill genuinely depends on harness features.

---

## Token Economics

### How Skill Loading Works

1. **Startup**: ~50-100 tokens of metadata (name + description) loads per installed skill.
2. **Discovery budget**: All metadata shares ~2% of context window. Too many verbose descriptions = some skills excluded.
3. **Activation**: Full SKILL.md loads when skill is triggered.
4. **Resource loading**: Only when the workflow explicitly routes to a reference, script, or asset.

### Practical Implications

- The `description` field is the most important line in the skill. Write it like a search snippet — specific trigger words, clear purpose, when to use it.
- Keep SKILL.md body under ~500 lines / ~5000 tokens. Heavy detail goes in `references/`.
- Resources are free until loaded. A skill with 5 reference docs that loads 1 at a time beats a monolithic SKILL.md.
- **Add what the model lacks, omit what it knows.** Don't explain git. Do explain your specific workflow. Focus on project-specific conventions and non-obvious edge cases.

---

## Naming Conventions

### Core Rule: Name the Capability, Not the Implementation

The name should survive a tool swap. `browser` works if you swap Playwright for Puppeteer. `playwright-browser` doesn't.

### Patterns

| Asset Type | Pattern | Examples |
|---|---|---|
| Skill | `<capability>` | `browser`, `doc-vault`, `quality-gate` |
| Agent | `<capability>-<role>` | `browser-qa`, `browser-automation`, `voice-designer` |
| Reference | `<context>.md` | `javascript.md`, `python.md`, `nextjs.md` |
| Project-local skill | `<domain-action>` | `critique`, `illustrate`, `validate` |

### Family Prefixes for Discovery

Related assets share a prefix so searching by prefix finds the whole family. A `browser` skill has agents named `browser-qa`, `browser-automation` — all discoverable by prefix.

---

## Conventions

### Prerequisites Section

Optional section between Purpose and Variables. Use when the skill depends on external tools, services, or environment setup. List what must be available — don't install anything, just check and fail gracefully.

```markdown
## Prerequisites

- `playwright-cli` must be installed and available in PATH
- Node.js >= 18 required
```

### Variables: The Local Vocabulary Pattern

Variables are a **prompt engineering pattern**, not a system feature. Any LLM parses them as markdown and holds them in context. They provide:

1. **Named constants** — reference throughout without repeating values
2. **Configuration surface** — change behavior by editing one line
3. **Semantic context** — name says what it is, comment says what it's for

Format:
```markdown
## Variables

CACHE_DIR: ./cache                            # Where cached docs are stored (relative to skill root)
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

### Routing to References

```markdown
## References

### Scenario Name

- IF: Condition that triggers this reference
- THEN: Read and execute `./references/file-name.md`
- EXAMPLES:
  - "example user request 1"
  - "example user request 2"
```

---

## Anti-Patterns

### Structure
- **Monolithic SKILL.md** — Over 500 lines? Break it into references.
- **Deep nesting** — References shouldn't chain to other references. One level deep from SKILL.md.
- **Duplication** — Same info in two places means one will rot.
- **Forbidden sections** — Quick Reference, separate Examples, Notes, Instructions, Success Criteria. These duplicate what belongs inline in workflow steps or variable comments.
- **Omni-skills** — A skill that orchestrates AND does the low-level work. Split by abstraction level.

### Content
- **Teaching the model what it knows** — Don't explain `git`. Do explain your specific workflow.
- **Vague steps** — "Process the files" = bad. "Run `eslint --format json` on `*.ts` files" = good.
- **Missing examples** — Every workflow step needs an inline example.
- **Time-sensitive info** — "Latest version is 4.2" will rot. Link to docs.
- **Declarations instead of procedures** — "Output must be clean" = bad. "Run linter, fix errors, re-run until clean" = good.

### Naming
- **Implementation in name** — `playwright-browser` instead of `browser`
- **Generic words alone** — `helper`, `utils`, `tools`

### Portability
- **Hardcoded absolute paths** — Use relative paths from skill root for portability.
- **Harness-specific features in the body** — Keep them in frontmatter where they degrade gracefully.
- **Secrets in skills** — No API keys, tokens, or credentials.
- **Project assumptions** — Reusable skills must work without project-specific context.
