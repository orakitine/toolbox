# Create a Skill

Step-by-step workflow for creating a new Claude Code skill from scratch. Assumes PRINCIPLES.md is already loaded (SKILL.md Step 2).

## Workflow

1. **Gather Requirements**
   - Ask the user (or determine from context):
     - What capability does this skill provide?
     - When should it activate — user-invoked, Claude-invoked, or both?
     - Does it have side effects (writes files, sends messages, costs money)?
     - Are there multiple scenarios/contexts that need different workflows?
   - Example: "I want a skill that runs linting before commits" → capability: quality checks, user-invoked, no side effects beyond reporting, multiple scenarios (JS, Python)

2. **Choose a Name**
   - Apply naming convention: name the CAPABILITY, not the implementation
   - Check for family conflicts: will this skill have related agents? Use consistent prefix.
   - IF: skill wraps a specific tool → name the category, not the tool
   - Example: wraps Playwright → name it `browser`, not `playwright-browser`
   - Example: wraps ESLint + Prettier + tsc → name it `quality-gate`, not `eslint-checker`
   - Validate: would this name still make sense if the underlying tool changed?

3. **Write the Description**
   - Apply description rules from Principles (see "Description: The 100-Token Pitch")
   - Example: "Headless browser automation for testing, screenshots, scraping, and parallel sessions. Use for UI validation, web scraping, or browser-based workflows."
   - Bad example: "Helps with browser stuff"

4. **Determine Invocation Mode**
   - Has side effects (commit, deploy, delete, costs money)?
     - YES → `disable-model-invocation: true`
   - Should user be able to invoke directly?
     - NO (background helper) → `user-invocable: false`
   - Otherwise → leave defaults (both can invoke)
   - Example: quality-gate reports issues but doesn't fix them → default (both)
   - Example: commit skill pushes code → `disable-model-invocation: true`

5. **Select Allowed Tools**
   - Apply allowed-tools rules from Principles (see "Allowed-Tools Selection")
   - Example: quality-gate only reports → `Read`, `Glob`, `Bash` (no Write)
   - Example: skill-forge creates files → needs `Read`, `Write`, `Edit`, `Glob`, `Grep`, `Bash`, `Agent`

6. **Create the Skill Directory and Write Frontmatter**
   - Create the skill directory: `skills/<name>/`
   - Create `SKILL.md` inside it
   - Assemble all decisions from steps 2-5 into YAML frontmatter
   - See Principles "Frontmatter Fields" for full field reference
   - Example:
     ```yaml
     ---
     name: quality-gate
     description: >-
       Comprehensive code quality verification that checks linting,
       formatting, type safety, tests, and build. Non-destructive —
       only reports issues without making changes.
     allowed-tools:
       - Read
       - Glob
       - Bash
     ---
     ```
   - IF: skill delegates to an agent → add `context: fork` and `agent: <name>`
   - IF: skill takes arguments → add `argument-hint: "[what-goes-here]"`

7. **Write the Purpose Section**
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

8. **Define Variables (if needed)**
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

9. **Design the Workflow**
   - Numbered steps with bold names
   - Each step MUST have an inline example showing expected behavior
   - Use IF/THEN for conditional logic
   - Reference specific tools with parameters
   - Keep to 5-8 steps. If more, the skill is probably too complex — break into cookbooks.
   - Example step:
     ```markdown
     1. **Detect Project Type**
        - Check for indicator files in project root
        - IF: package.json exists → JavaScript/TypeScript project
        - ELSE IF: pyproject.toml exists → Python project
        - Example: package.json with "vitest" in devDeps → JS project with Vitest
        - Tool: Glob for `package.json`, `pyproject.toml`
     ```

10. **Create Cookbooks OR Separate Skills (if needed)**
    - First: is this a different SCENARIO of the same task, or a higher-level construct?
    - IF: different scenario, same abstraction level → create cookbook
    - IF: higher-order construct that CONSUMES this skill → create a separate skill with `requires` dependency
    - Example: JS vs Python quality checks → cookbooks (same task, different context)
    - Example: "run saved workflows through browser" → separate skill (orchestration consuming browser)
    - IF: cookbook path chosen:
      - workflow has branching logic with >2 scenarios → create cookbooks
      - any scenario needs >20 lines of detail → move to cookbook
      - reference material is heavy → put in `reference/` dir, load from cookbook
    - Each cookbook follows same structure: purpose, optional variables, workflow, optional failure criteria
    - Route from SKILL.md with IF/THEN/EXAMPLES pattern:
      ```markdown
      ## Cookbook

      ### JavaScript/TypeScript Projects

      - IF: package.json exists AND ENABLE_JAVASCRIPT is true
      - THEN: Read and execute `${CLAUDE_SKILL_DIR}/cookbook/javascript.md`
      - EXAMPLES:
        - "run quality gate"
        - "check code quality"
      ```

11. **Create Supporting Files (if needed)**
    - Consult `${CLAUDE_SKILL_DIR}/reference/directory-layout.md` for full layout options
    - `scripts/` — for deterministic operations (shell, python)
    - `templates/` — for structured output formats
    - `reference/` — for heavy docs loaded on demand
    - `prompts/` — for reusable sub-prompts
    - All internal references use `${CLAUDE_SKILL_DIR}` for portability

12. **Validate the Skill**
    - Read the complete skill end-to-end
    - Check against principles:
      - [ ] Frontmatter has explicit name, description, allowed-tools
      - [ ] Description is third-person, includes WHAT + WHEN, has trigger words
      - [ ] Purpose is one paragraph
      - [ ] Variables have inline comments (if present)
      - [ ] Every workflow step has an inline example
      - [ ] Cookbooks use IF/THEN/EXAMPLES routing
      - [ ] No forbidden sections (Quick Reference, separate Examples, Notes)
      - [ ] No duplication between SKILL.md and cookbooks
      - [ ] All file references use `${CLAUDE_SKILL_DIR}`
      - [ ] SKILL.md body under 300 lines
    - IF: issues found → fix before declaring done

## Error Handling

- IF: user is unsure about naming → show them 2-3 options with trade-offs, let them choose
- IF: skill scope is too broad → suggest splitting into multiple skills or skill + cookbooks
- IF: skill duplicates an existing skill → flag it, suggest extending the existing one instead
