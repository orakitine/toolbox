---
name: skill-forge
description: >-
  Creates, evaluates, and refines agent skills following the agentskills.io
  specification. Use when building new skills from scratch, auditing existing
  skills for quality, or cleaning up skill structure and naming. Produces
  portable skills that work across any compliant agent harness.
argument-hint: "[create|evaluate|refine] [skill-name or path]"
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

Skill-forge is the meta-skill for creating and maintaining agent skills. It enforces the principles defined in `./references/PRINCIPLES.md` and the [agentskills.io specification](https://agentskills.io/specification), producing portable skills that work across any compliant harness (Claude Code, Pi, Cursor, Goose, Kiro, etc.). Harness-specific extensions are layered on top when needed.

## Workflow

1. **Parse Request**
   - Determine mode from user input or `$ARGUMENTS`
   - IF: "create", "new", "build" → Creation mode
   - IF: "evaluate", "audit", "review", "check" → Evaluation mode
   - IF: "refine", "rewrite", "modernize", "clean up", "improve", "migrate" → Refine mode
   - Example: "/skill-forge create browser" → Creation mode, skill named "browser"
   - Example: "/skill-forge evaluate doc-vault" → Evaluation mode on existing skill
   - Example: "/skill-forge refine playwright-browser" → Refine mode, rewrite existing skill

2. **Load Principles**
   - Read `./references/PRINCIPLES.md` for universal conventions and standards
   - This is the source of truth for all quality decisions
   - Example: Principles loaded → ready to apply naming, structure, and content rules

3. **Determine Harness Target**
   - IF: user specifies a harness (e.g., "for Claude Code", "for Pi") → note the target
   - IF: skill is in a harness-specific directory (e.g., `.claude/skills/`) → infer the target
   - IF: no indication → default to universal (portable) format
   - IF: harness target identified → also load the relevant harness reference (e.g., `./references/claude-code.md`)
   - Example: "create a skill for Claude Code" → load claude-code.md for additional frontmatter/conventions
   - Example: "create a browser skill" (no harness specified) → universal format only

4. **Route to Workflow Reference**
   - Based on mode and asset type, route to the appropriate reference
   - IF: Creation mode → determine asset type, route to creation reference
   - IF: Evaluation mode → route to evaluation reference
   - IF: Refine mode → route to refine reference
   - Example: "create new agent for voice design" → `./references/create-agent.md` (Claude Code specific)
   - Example: "refine the old browser skill" → `./references/refine.md`

## References

### Create a Skill

- IF: User wants to create a new skill (SKILL.md with optional references, scripts, etc.)
- THEN: Read `./references/create-skill.md` and `./references/directory-layout.md`. IF harness target is Claude Code, also read `./references/claude-code.md`. Then execute the create-skill workflow.
- EXAMPLES:
  - "/skill-forge create browser"
  - "build a new skill for code review"
  - "create a skill that manages docker containers"

### Create an Agent (Claude Code)

- IF: User wants to create an agent definition — this is a Claude Code-specific feature
- THEN: Read `./references/claude-code.md` for context, then read and execute `./references/create-agent.md`
- EXAMPLES:
  - "/skill-forge create agent for QA testing"
  - "build an agent that does security reviews"

### Refine an Existing Skill

- IF: User wants to rewrite, modernize, migrate, or improve an existing skill
- THEN: Read `./references/refine.md` and `./references/evaluate.md` (needed for the evaluate+fix loop). IF harness target is Claude Code, also read `./references/claude-code.md`. Then execute the refine workflow.
- EXAMPLES:
  - "/skill-forge refine playwright-browser"
  - "modernize the doc-vault skill"
  - "clean up and rewrite quality-gate"
  - "make this skill portable"

### Evaluate Existing Skill (Independent Review — Default)

- IF: User wants to audit, review, or check AND did NOT say "inline"
- THEN: Read `./references/evaluate.md`. IF harness target is Claude Code, also read `./references/claude-code.md` for the CC-specific checklist. Then spawn a subagent (if supported by harness) with the evaluate workflow as its task. Pass it the skill path, the full PRINCIPLES.md content, the evaluate.md checklist, and any harness-specific checklist. The subagent returns a report. This ensures independent, unbiased review.
- EXAMPLES:
  - "/skill-forge evaluate doc-vault"
  - "audit all my skills"
  - "review the quality-gate skill"

### Evaluate Existing Skill (Inline)

- IF: User wants to evaluate AND says "inline" or "quick check"
- THEN: Read `./references/evaluate.md`. IF harness target is Claude Code, also read `./references/claude-code.md`. Execute the evaluate workflow directly in the main context. Use this for quick checks or when interactive discussion during evaluation is needed.
- EXAMPLES:
  - "/skill-forge evaluate doc-vault inline"
  - "quick check the browser skill"
