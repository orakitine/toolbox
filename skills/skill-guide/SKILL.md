---
name: skill-guide
description: Discovers and explains installed skills and agents. Lists what's available (global and project), shows how to use them, explains skill families and dependencies. Use when asking what skills exist, how to use a skill, or what tools are available for a task.
argument-hint: "[skill-name or question]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Purpose

Scan installed skills and agents, present them in human-friendly format, and answer questions about what's available, how to use it, and what's related. Works with any installed skill regardless of origin — not tied to a specific registry or toolbox.

## Variables

GLOBAL_SKILLS_DIR: ~/.claude/skills           # Where global skills are installed
GLOBAL_AGENTS_DIR: ~/.claude/agents           # Where global agents are installed
PROJECT_SKILLS_DIR: .claude/skills            # Where project-level skills are installed
PROJECT_AGENTS_DIR: .claude/agents            # Where project-level agents are installed
REGISTRY_YAML: ~/.claude/skills/registry/registry.yaml    # Registry catalog for dependency info (optional)

## Workflow

1. **Parse Request**
   - Determine mode from user input or `$ARGUMENTS`
   - IF: no args, "list", "what's available", "what skills" → Inventory mode
   - IF: specific skill/agent name → Detail mode
   - IF: question about a task ("how do I...", "what's the best way to...") → Recommend mode
   - Example: "/skill-guide" → Inventory mode
   - Example: "/skill-guide browser" → Detail mode for browser family
   - Example: "/skill-guide how do I test my UI" → Recommend mode

2. **Scan Installed Assets**
   - Glob for SKILL.md files in both global and project directories
   - Glob for AGENT.md and *.md files in agent directories
   - For each found: read frontmatter (name, description) — stop at first `---` close
   - IF: README.md exists alongside SKILL.md → note it for detail mode
   - IF: REGISTRY_YAML exists → read it for dependency info (`requires` fields)
   - Example: Found 4 skills in global, 2 in project, 3 agents → total inventory
   - Tool: Glob `<GLOBAL_SKILLS_DIR>/*/SKILL.md`, `<PROJECT_SKILLS_DIR>/*/SKILL.md`, Glob agents

3. **Route to Cookbook**
   - IF: Inventory mode → route to inventory cookbook
   - IF: Detail mode → route to detail cookbook
   - IF: Recommend mode → route to recommend cookbook
   - Example: "/skill-guide" → `cookbook/inventory.md`

## Cookbook

### Inventory — What's Available

- IF: User wants to see all installed skills and agents
- THEN: Read and execute `${CLAUDE_SKILL_DIR}/cookbook/inventory.md`
- EXAMPLES:
  - "/skill-guide"
  - "what skills do I have?"
  - "list all available tools"
  - "what's installed?"

### Detail — Tell Me About This Skill

- IF: User asks about a specific skill, agent, or family
- THEN: Read and execute `${CLAUDE_SKILL_DIR}/cookbook/detail.md`
- EXAMPLES:
  - "/skill-guide browser"
  - "how do I use the quality-gate skill?"
  - "tell me about the browser family"
  - "what options does browser-review have?"

### Recommend — What Should I Use For This Task

- IF: User describes a task and wants to know which skill to use
- THEN: Read and execute `${CLAUDE_SKILL_DIR}/cookbook/recommend.md`
- EXAMPLES:
  - "how do I test my UI?"
  - "what's the best way to automate browser tasks?"
  - "I need to validate user stories across my app"
  - "how can I check code quality before committing?"
