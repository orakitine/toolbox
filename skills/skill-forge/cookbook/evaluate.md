# Evaluate Existing Skill

Audit skills, agents, and commands against creation principles. Reports issues by severity with specific fix suggestions. Assumes PRINCIPLES.md is already loaded (SKILL.md Step 2).

## Variables

SEVERITY_LEVELS: critical, warning, info    # Issue severity classification
AUTO_FIX: false                              # Whether to auto-fix issues (with confirmation)

## Workflow

1. **Identify Target**
   - Determine what to evaluate from user input
   - IF: specific skill named → evaluate that skill
   - IF: directory path given → evaluate all skills in that directory
   - IF: "all" or no target → evaluate all installed skills in `~/.claude/skills/`
   - Example: "/skill-forge evaluate doc-vault" → evaluate `~/.claude/skills/doc-vault/`
   - Example: "/skill-forge evaluate ~/Documents/toolbox/staging/skills/" → batch evaluation

2. **Read the Asset**
   - Read the SKILL.md (or AGENT.md) completely
   - Read all cookbooks and supporting files
   - Note the directory structure
   - Example: Read doc-vault/SKILL.md + all cookbook/*.md + README.md → full picture

3. **Check Frontmatter**
   - CRITICAL: `description` field present and meaningful?
   - CRITICAL: `description` is third-person, includes WHAT + WHEN?
   - CRITICAL: `description` under 1024 chars?
   - CRITICAL: `allowed-tools` explicitly listed?
   - WARNING: `name` field present? (defaults to dir name if missing, but explicit is better)
   - WARNING: Uses deprecated `trigger:` field instead of `disable-model-invocation`/`user-invocable`?
   - WARNING: `context: fork` set but referenced `agent:` doesn't exist?
   - INFO: `argument-hint` present if skill takes arguments?
   - INFO: `context`/`agent` fields set if skill delegates to an agent?
   - INFO: For agents — `color` field present? Matches role convention from Principles?
   - Example: Missing description → CRITICAL: "No description field. This skill will have poor activation accuracy."
   - Example: Agent missing color → INFO: "No color field. See Principles for role-based color convention."

4. **Check Naming**
   - WARNING: Does the name describe the implementation instead of the capability?
   - WARNING: Is the name generic (`helper`, `utils`, `tools`)?
   - WARNING: If part of a family, does the prefix match related agents/skills?
   - INFO: Is the name concise (under 30 chars)?
   - Example: `playwright-browser` → WARNING: "Name includes implementation detail 'playwright'. Consider renaming to 'browser'."

5. **Check Structure**
   - CRITICAL: SKILL.md body over 300 lines? → suggest breaking into cookbooks
   - CRITICAL: Forbidden sections present? (Quick Reference, separate Examples, Notes, Instructions, Success Criteria)
   - WARNING: Duplication between SKILL.md and cookbooks?
   - WARNING: Hardcoded paths instead of `${CLAUDE_SKILL_DIR}`?
   - WARNING: README.md missing? (recommended for human discovery — quick start, options, examples, related skills)
   - INFO: README.md present but missing standard sections? (quick start, options, examples, related)
   - Example: Found "## Quick Reference" section → CRITICAL: "Forbidden section. Merge content into Workflow."

6. **Check Variables**
   - WARNING: Variables without inline comments?
   - WARNING: Variables not in SCREAMING_SNAKE_CASE?
   - WARNING: Multiple variables on same line?
   - INFO: Variables that appear only once — could be inlined?
   - INFO: Internal constants exposed as variables?
   - Example: `cache_dir: path` → WARNING: "Variable 'cache_dir' should be SCREAMING_SNAKE_CASE: CACHE_DIR"

7. **Check Workflow Quality**
   - CRITICAL: No `## Workflow` section present?
   - CRITICAL: Workflow steps missing inline examples?
   - CRITICAL: Step names not bold (`**Step Name**`)?
   - CRITICAL: Steps not numbered?
   - WARNING: Vague steps without specific actions? ("Process the files")
   - WARNING: Tool references without specific parameters?
   - WARNING: Conditionals not using IF/THEN format?
   - INFO: More than 8 workflow steps? (consider breaking into cookbooks)
   - Example: Step "2. **Process** - Handle the input" → CRITICAL: "Vague step. What specific action? What tool? Add an inline example."

8. **Check Cookbooks**
   - CRITICAL: Cookbooks reference other cookbooks? (must be one level deep from SKILL.md)
   - WARNING: Cookbook operates at a different abstraction level than the core skill? (should be a separate skill with `requires`)
   - WARNING: SKILL.md cookbook routing missing IF/THEN/EXAMPLES structure?
   - WARNING: Cookbook files missing purpose statement?
   - WARNING: Cookbook over 200 lines? (consider splitting or moving heavy content to reference/)
   - WARNING: Content that teaches Claude what it already knows? (e.g., explaining how standard tools work)
   - WARNING: Time-sensitive information? (version numbers, "latest" claims — will rot)
   - INFO: Cookbooks with their own Variables that shadow skill-level Variables?
   - Example: Cookbook routing says "See cookbook/js.md" without IF/THEN → WARNING: "Use IF/THEN/EXAMPLES routing format."
   - Example: "The latest version of ESLint is 9.2" → WARNING: "Time-sensitive info will rot. Link to docs instead."
   - Example: Browser skill has "run-workflow" cookbook that orchestrates saved workflows → WARNING: "Different abstraction level. Should be a separate skill with `requires: [skill:browser]`."

9. **Check Distribution Readiness**
   - WARNING: Secrets, API keys, or credentials in any file?
   - WARNING: Hardcoded absolute paths (not using `${CLAUDE_SKILL_DIR}`)?
   - WARNING: Project-specific assumptions in a toolbox skill?
   - Example: Found `/Users/alice/.claude/skills/doc-vault/cache` → WARNING: "Hardcoded path. Use ${CLAUDE_SKILL_DIR}/cache"

10. **Generate Report**
    - Compile all findings into a structured report
    - Group by severity: CRITICAL first, then WARNING, then INFO
    - Include specific line numbers and fix suggestions
    - Example report:
      ```
      SKILL-FORGE EVALUATION: doc-vault
      ═══════════════════════════════════

      CRITICAL (1)
        [SKILL.md:3] Description uses first person "I cache docs..."
          → Fix: Rewrite in third person: "Caches and serves documentation..."

      WARNING (3)
        [SKILL.md:15] Variable CACHE_DIR uses hardcoded absolute path
          → Fix: Use ${CLAUDE_SKILL_DIR}/cache
        [SKILL.md:42] Workflow step 3 missing inline example
          → Fix: Add "Example: 'check Stripe docs' → loads cached Stripe reference"
        [cookbook/fetch.md:1] Missing purpose statement
          → Fix: Add 1-2 sentence description after title

      INFO (1)
        [SKILL.md] Consider adding argument-hint for slash command autocomplete

      OVERALL: 1 critical, 3 warnings, 1 info
      ```
    - IF: AUTO_FIX is true → offer to apply fixes one by one with user confirmation
    - IF: batch evaluation → generate summary across all skills with aggregate counts

## Error Handling

- IF: target skill not found → list available skills, ask user to clarify
- IF: skill has non-standard structure → evaluate what exists, note deviations
- IF: skill is project-local with domain-specific patterns → adjust evaluation (don't flag domain vars as unnecessary)
