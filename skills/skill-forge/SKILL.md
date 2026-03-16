---
name: skill-forge
description: Creates, evaluates, and refines Claude Code skills, agents, and commands. Use when building new skills from scratch, auditing existing skills for quality, or cleaning up skill structure and naming.
argument-hint: "[create|evaluate] [skill-name or path]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
---

# Purpose

Skill-forge is the meta-skill for creating and maintaining Claude Code skills, agents, and commands. It enforces the principles defined in `${CLAUDE_SKILL_DIR}/reference/PRINCIPLES.md` and provides step-by-step workflows for building new assets or auditing existing ones.

## Variables

PRINCIPLES_PATH: ${CLAUDE_SKILL_DIR}/reference/PRINCIPLES.md       # Creation principles reference

## Workflow

1. **Parse Request**
   - Determine mode from user input or `$ARGUMENTS`
   - IF: "create", "new", "build" → Creation mode
   - IF: "evaluate", "audit", "review", "check", "refine", "clean up", "improve" → Evaluation mode
   - Example: "/skill-forge create browser" → Creation mode, skill named "browser"
   - Example: "/skill-forge evaluate doc-vault" → Evaluation mode on existing skill

2. **Load Principles**
   - Read `${CLAUDE_SKILL_DIR}/reference/PRINCIPLES.md` for conventions and standards
   - This is the source of truth for all quality decisions
   - Example: Principles loaded → ready to apply naming, structure, and content rules

3. **Route to Cookbook**
   - Based on mode and asset type, route to the appropriate cookbook
   - IF: Creation mode → determine asset type, route to creation cookbook
   - IF: Evaluation mode → route to evaluation cookbook
   - Example: "create new agent for voice design" → `cookbook/create-agent.md`

## Cookbook

### Create a Skill

- IF: User wants to create a new skill (SKILL.md with optional cookbooks, scripts, etc.)
- THEN: Read and execute `${CLAUDE_SKILL_DIR}/cookbook/create-skill.md`
- EXAMPLES:
  - "/skill-forge create browser"
  - "build a new skill for code review"
  - "create a skill that manages docker containers"

### Create an Agent

- IF: User wants to create an agent definition (AGENT.md)
- THEN: Read and execute `${CLAUDE_SKILL_DIR}/cookbook/create-agent.md`
- EXAMPLES:
  - "/skill-forge create agent for QA testing"
  - "build an agent that does security reviews"

### Evaluate Existing Skill

- IF: User wants to audit, review, or clean up an existing skill, agent, or command
- THEN: Read and execute `${CLAUDE_SKILL_DIR}/cookbook/evaluate.md`
- EXAMPLES:
  - "/skill-forge evaluate doc-vault"
  - "audit all skills in ~/.claude/skills/"
  - "review the quality-gate skill"
  - "clean up the browser skill"
