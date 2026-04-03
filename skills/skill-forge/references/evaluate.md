# Evaluate Existing Skill

Audit skills against creation principles and the agentskills.io specification. Reports issues by severity with specific fix suggestions. Assumes PRINCIPLES.md is already loaded.

## Variables

SEVERITY_LEVELS: critical, warning, info    # Issue severity classification
AUTO_FIX: false                              # Whether to auto-fix issues (with confirmation)

## Workflow

1. **Identify Target**
   - Determine what to evaluate from user input
   - IF: specific skill named → evaluate that skill
   - IF: directory path given → evaluate all skills in that directory
   - IF: "all" or no target → evaluate all installed skills (check `.agents/skills/` and harness-specific paths)
   - Example: "evaluate doc-vault" → find and evaluate `doc-vault/`
   - Example: "evaluate all skills" → batch evaluation across all discovery paths

2. **Read the Asset**
   - Read the SKILL.md completely
   - Read all references and supporting files
   - Note the directory structure
   - Example: Read doc-vault/SKILL.md + all references/*.md → full picture

3. **Check Frontmatter (Universal)**
   - CRITICAL: `name` field present?
   - CRITICAL: `description` field present and meaningful?
   - CRITICAL: `description` includes WHAT it does + WHEN to use it?
   - CRITICAL: `description` under 1024 chars?
   - CRITICAL: `name` matches directory name?
   - CRITICAL: `name` is lowercase letters, numbers, hyphens only? Max 64 chars?
   - WARNING: `description` missing specific trigger words?
   - INFO: `license` field present?
   - INFO: `metadata` with author/version present?
   - Example: Missing description → CRITICAL: "No description field. This skill will not activate correctly in any harness."

4. **Check Naming**
   - WARNING: Does the name describe the implementation instead of the capability?
   - WARNING: Is the name generic (`helper`, `utils`, `tools`)?
   - WARNING: If part of a family, does the prefix match related skills?
   - INFO: Is the name concise (under 30 chars)?
   - Example: `playwright-browser` → WARNING: "Name includes implementation detail 'playwright'. Consider renaming to 'browser'."

5. **Check Structure**
   - CRITICAL: SKILL.md body over 500 lines / ~5000 tokens? → suggest breaking into references
   - CRITICAL: Forbidden sections present? (Quick Reference, separate Examples, Notes, Instructions, Success Criteria)
   - WARNING: Duplication between SKILL.md and references?
   - WARNING: References chain to other references? (should be one level deep)
   - WARNING: Non-standard directories that aren't in the spec? (may reduce portability)
   - Example: Found "## Quick Reference" section → CRITICAL: "Forbidden section. Merge content into Workflow."

6. **Check Variables**
   - WARNING: Variables without inline comments?
   - WARNING: Variables not in SCREAMING_SNAKE_CASE?
   - WARNING: Multiple variables on same line?
   - INFO: Variables that appear only once — could be inlined?
   - Example: `cache_dir: path` → WARNING: "Variable 'cache_dir' should be SCREAMING_SNAKE_CASE: CACHE_DIR"

7. **Check Workflow Quality**
   - CRITICAL: No `## Workflow` section present?
   - CRITICAL: Workflow steps missing inline examples?
   - CRITICAL: Step names not bold (`**Step Name**`)?
   - CRITICAL: Steps not numbered?
   - WARNING: Vague steps without specific actions? ("Process the files")
   - WARNING: Declarations instead of procedures? ("Output must be clean" instead of "Run linter, fix, re-run")
   - WARNING: Conditionals not using IF/THEN format?
   - WARNING: Content that teaches the model what it already knows? (e.g., explaining how git works)
   - WARNING: Time-sensitive information? (version numbers, "latest" claims — will rot)
   - INFO: More than 8 workflow steps? (consider breaking into references)
   - Example: Step "2. **Process** - Handle the input" → CRITICAL: "Vague step. What specific action? Add an inline example."

8. **Check References**
   - CRITICAL: References chain to other references? (must be one level deep from SKILL.md)
   - WARNING: Reference operates at a different abstraction level than the core skill? (should be a separate skill)
   - WARNING: SKILL.md reference routing missing IF/THEN/EXAMPLES structure?
   - WARNING: Reference files missing purpose statement?
   - WARNING: Reference over 200 lines? (consider splitting or moving heavy content)
   - Example: Reference routing says "See references/js.md" without IF/THEN → WARNING: "Use IF/THEN/EXAMPLES routing format."

9. **Check Portability**
   - WARNING: Secrets, API keys, or credentials in any file?
   - WARNING: Hardcoded absolute paths? (use relative paths from skill root)
   - WARNING: Harness-specific variables in the body? (e.g., `${CLAUDE_SKILL_DIR}` — use relative paths)
   - WARNING: Harness-specific features in the body instead of frontmatter?
   - WARNING: Project-specific assumptions in a reusable skill?
   - INFO: Skill placed in harness-specific directory but could be in `.agents/skills/` for interop?
   - Example: Found `/Users/alice/skills/doc-vault/cache` → WARNING: "Hardcoded path. Use `./cache`"

10. **Check Harness-Specific Compliance (if applicable)**
    - IF: skill is in a harness-specific directory (e.g., `.claude/skills/`) OR has harness-specific frontmatter
    - THEN: apply the harness-specific evaluation checklist (pre-loaded by SKILL.md when harness target was detected in step 3)
    - This is additive — universal checks always run, harness checks layer on top
    - Example: Skill in `.claude/skills/` with `allowed-tools` → also run Claude Code checklist

11. **Generate Report**
    - Compile all findings into a structured report
    - Group by severity: CRITICAL first, then WARNING, then INFO
    - Include specific line numbers and fix suggestions
    - Example report:
      ```
      SKILL-FORGE EVALUATION: doc-vault
      ══════��════════════════════════════

      CRITICAL (1)
        [SKILL.md:3] Description uses first person "I cache docs..."
          → Fix: Rewrite as "Caches and serves documentation..."

      WARNING (3)
        [SKILL.md:15] Variable CACHE_DIR uses hardcoded absolute path
          → Fix: Use ./cache (relative to skill root)
        [SKILL.md:42] Workflow step 3 missing inline example
          → Fix: Add "Example: 'check Stripe docs' → loads cached Stripe reference"
        [SKILL.md] Harness-specific ${CLAUDE_SKILL_DIR} in body
          → Fix: Replace with relative path ./references/api.md

      INFO (1)
        [SKILL.md] Skill in .claude/skills/ — could be portable via .agents/skills/

      OVERALL: 1 critical, 3 warnings, 1 info
      ```
    - IF: AUTO_FIX is true → offer to apply fixes one by one with user confirmation
    - IF: batch evaluation → generate summary across all skills with aggregate counts

## Error Handling

- IF: target skill not found → list available skills, ask user to clarify
- IF: skill has non-standard structure → evaluate what exists, note deviations
- IF: skill is project-local with domain-specific patterns → adjust evaluation (don't flag domain vars as unnecessary)
