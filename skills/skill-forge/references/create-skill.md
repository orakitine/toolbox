# Create a Skill

Step-by-step workflow for creating a new skill from scratch. Harness-agnostic — produces skills that work across any compliant agent harness. Assumes PRINCIPLES.md is already loaded.

## Workflow

1. **Gather Requirements**
   - Ask the user (or determine from context):
     - What capability does this skill provide?
     - When should it activate?
     - Does it have side effects (writes files, sends messages, costs money)?
     - Are there multiple scenarios/contexts that need different workflows?
     - What harness(es) should it target? (universal, Claude Code, Pi, etc.)
   - Example: "I want a skill that runs linting before commits" → capability: quality checks, no side effects beyond reporting, multiple scenarios (JS, Python), universal target

2. **Choose a Name**
   - Apply naming convention: name the CAPABILITY, not the implementation
   - Check for family conflicts: will this skill have related assets? Use consistent prefix.
   - IF: skill wraps a specific tool → name the category, not the tool
   - Example: wraps Playwright → name it `browser`, not `playwright-browser`
   - Example: wraps ESLint + Prettier + tsc → name it `quality-gate`, not `eslint-checker`
   - Validate: would this name still make sense if the underlying tool changed?
   - The directory name MUST match the `name` field in frontmatter.

3. **Write the Description**
   - This is the most important line — it determines whether any harness activates the skill.
   - Hybrid voice: third-person WHAT + imperative WHEN.
   - Include specific trigger words that match how users phrase requests.
   - Max 1024 characters.
   - Example: "Headless browser automation for testing, screenshots, scraping, and parallel sessions. Use when driving browsers, capturing screenshots, or running browser-based workflows."
   - Bad example: "Helps with browser stuff"

4. **Write the Frontmatter**
   - Start with standard fields (recognized by all harnesses):
     ```yaml
     ---
     name: quality-gate
     description: >-
       Comprehensive code quality verification that checks linting,
       formatting, type safety, tests, and build. Use when checking
       code before committing.
     license: MIT
     metadata:
       author: your-name
       version: "1.0"
     ---
     ```
   - IF: targeting a specific harness → apply the harness-specific frontmatter fields (pre-loaded by SKILL.md before this reference)
   - Harness-specific fields are additive — they go in the same frontmatter block and are ignored by other harnesses

5. **Write the Purpose Section**
   - Single paragraph maximum
   - State what the skill does and when to use it
   - No examples here (save for Workflow)
   - Example:
     ```markdown
     # Purpose

     Run comprehensive quality checks to verify code quality before
     committing. Non-destructive analysis only — reports issues
     without auto-fixing.
     ```

6. **Add Prerequisites (if needed)**
   - IF: skill depends on external tools, services, or environment setup → add Prerequisites section
   - List what must be available — don't install anything
   - The workflow should check early and fail gracefully if missing
   - Example: `## Prerequisites\n\n- \`playwright-cli\` must be installed and available in PATH`
   - IF: no external dependencies → skip this section

7. **Define Variables (if needed)**
   - Only if there are genuinely configurable values
   - One per line, SCREAMING_SNAKE_CASE, inline comment
   - IF: value appears once and is self-explanatory → skip, inline it in the workflow
   - IF: value is referenced multiple times or user might want to change it → make it a variable
   - Example:
     ```markdown
     ## Variables

     ENABLE_JAVASCRIPT: true           # Enable JavaScript/TypeScript checks
     ENABLE_PYTHON: true               # Enable Python checks
     ```

8. **Design the Workflow**
   - Numbered steps with bold names
   - Each step MUST have an inline example showing expected behavior
   - Use IF/THEN for conditional logic
   - Reference specific tools with parameters
   - Keep to 5-8 steps. If more, the skill is probably too complex — break into references.
   - Write procedures, not declarations: teach HOW to approach the problem
   - Example step:
     ```markdown
     1. **Detect Project Type**
        - Check for indicator files in project root
        - IF: package.json exists → JavaScript/TypeScript project
        - ELSE IF: pyproject.toml exists → Python project
        - Example: package.json with "vitest" in devDeps → JS project with Vitest
     ```

9. **Create References (if needed)**
   - First: is this a different SCENARIO of the same task, or a higher-level construct?
   - IF: different scenario, same abstraction level → create reference in `references/`
   - IF: higher-order construct that CONSUMES this skill → create a separate skill
   - Example: JS vs Python quality checks → references (same task, different context)
   - Example: "run saved workflows through browser" → separate skill (orchestration consuming browser)
   - IF: reference path chosen:
     - workflow has branching logic with >2 scenarios → create references
     - any scenario needs >20 lines of detail → move to `references/`
   - Route from SKILL.md with IF/THEN/EXAMPLES pattern:
     ```markdown
     ## References

     ### JavaScript/TypeScript Projects

     - IF: package.json exists AND ENABLE_JAVASCRIPT is true
     - THEN: Read and execute `./references/javascript.md`
     - EXAMPLES:
       - "run quality gate"
       - "check code quality"
     ```

10. **Create Supporting Files (if needed)**
    - `scripts/` — for deterministic operations (shell, python). Design for agentic use: no interactive prompts, include --help, structured output, idempotent.
    - `assets/` — for templates, data files, images
    - All internal references use relative paths from skill root (`./scripts/check.sh`)

11. **Validate the Skill**
    - Read the complete skill end-to-end
    - Check against principles:
      - [ ] Frontmatter has `name` and `description` (required by spec)
      - [ ] Description uses hybrid voice (WHAT + WHEN), includes trigger words
      - [ ] Directory name matches `name` field
      - [ ] Purpose is one paragraph
      - [ ] Variables have inline comments (if present)
      - [ ] Every workflow step has an inline example
      - [ ] References use IF/THEN/EXAMPLES routing
      - [ ] No duplication between SKILL.md and references
      - [ ] All file references use relative paths
      - [ ] SKILL.md body under 500 lines / 5000 tokens
    - IF: targeting a specific harness → also check harness-specific requirements
    - IF: issues found → fix before declaring done

## Error Handling

- IF: user is unsure about naming → show them 2-3 options with trade-offs, let them choose
- IF: skill scope is too broad → suggest splitting into multiple skills or skill + references
- IF: skill duplicates an existing skill → flag it, suggest extending the existing one instead
