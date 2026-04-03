# Refine an Existing Skill

Rewrite an existing skill to meet current principles and the agentskills.io specification. Understands intent first, rewrites from scratch, then validates. Assumes PRINCIPLES.md is already loaded.

## Variables

OUTPUT_SUFFIX: -refined                     # Suffix appended to original dir name for the rewrite

## Workflow

1. **Read the Original Completely**
   - Locate the skill from user input (path, name, or search)
   - Read SKILL.md
   - Read ALL references, scripts, assets — everything in the directory
   - Note the full directory structure and parent directory
   - Example: Read `doc-vault/SKILL.md` + 3 references + cache/ → complex skill
   - Example: Read `playwright-browser/SKILL.md` → single file, no references

2. **Understand: Intent and Purpose**
   - What is this skill trying to accomplish? What problem does it solve?
   - Who uses it and when? What triggers it?
   - Capture the GOAL, not the implementation details
   - Example: playwright-browser → "automates headless browsers for testing, scraping, and screenshots"
   - Example: doc-vault → "caches API documentation locally so the model has fresh, accurate references"

3. **Understand: Caveats and Side Effects**
   - Does this skill modify files, send messages, cost money?
   - Are there edge cases or failure modes the original handles?
   - What assumptions does it make about the environment?
   - Example: doc-vault auto-triggers on doc keywords — could be noisy if too aggressive

4. **Understand: Relationships**
   - Does this skill work with other skills or assets?
   - Is it part of a family (shared prefix)?
   - Are other skills expecting this one to exist?
   - Example: browser → has browser-qa and browser-operator as related assets

5. **Understand: Portability Context**
   - Where does this skill currently live? (`.agents/skills/`, `.claude/skills/`, etc.)
   - Does it use harness-specific features? Which ones?
   - Could it be made more portable? Should it be?
   - Example: Skill uses `${CLAUDE_SKILL_DIR}` throughout → can replace with relative paths
   - Example: Skill uses `context: fork` + `agent:` → keep in frontmatter (degrades gracefully), but body should be portable

6. **Rewrite from Principles**
   - Create a new directory next to the original: `<original-name><OUTPUT_SUFFIX>/`
   - IF: user specified an output path → use that instead
   - Start fresh — do NOT patch the old skill
   - Apply naming conventions: does the name need to change? (capability over implementation)
   - Write new frontmatter: standard fields first, harness-specific fields second
   - Write new Purpose section
   - Design new workflow with proper structure (bold steps, inline examples, IF/THEN)
   - Create references if branching logic exists
   - Use relative paths from skill root for all file references
   - The original remains untouched — it is the reference copy
   - Example: `playwright-browser/` untouched → `playwright-browser-refined/` created next to it

7. **Show the Diff**
   - Present the rewrite to the user
   - Highlight key changes: renamed? restructured? references added/removed? portability improved?
   - Show before/after for the most significant sections
   - Ask the user to review before proceeding
   - Example: "Proposing rename playwright-browser → browser. Replaced ${CLAUDE_SKILL_DIR} with relative paths. Added proper description with trigger words."

8. **Evaluate + Fix Loop**
   - Run the evaluation checklist (pre-loaded by SKILL.md alongside this reference) against the NEW version
   - IF: issues found → fix them
   - Repeat until evaluation passes clean (0 critical, 0 warning)
   - Example: First pass finds missing inline example in step 3 → add it → recheck → clean

9. **Fresh-Eyes Critique**
   - If the harness supports subagents, spawn one to review the migration independently
   - Pass it: the original skill content, the refined skill content, and PRINCIPLES.md
   - Task: "Compare these two versions. Is the rewrite faithful to the original's intent? Any capabilities lost? Any improvements missed? Is the new version following principles correctly?"
   - IF: critique identifies issues → fix them before proceeding
   - IF: harness doesn't support subagents → do the comparison yourself, explicitly listing preserved/changed/removed capabilities

10. **Compare for Regression**
    - Compare original capabilities against rewritten version
    - For each workflow step or feature in the original:
      - Is it preserved in the new version?
      - If removed, was it intentional? (document why)
      - If changed, does the new approach cover the same cases?
    - Present a capability comparison:
      ```
      CAPABILITY COMPARISON: playwright-browser → browser
      ═══════════════════════════════════════════════════

      PRESERVED
        ✓ Headless browser automation
        ✓ Screenshot capture
        ✓ Parallel session support

      CHANGED
        ~ ${CLAUDE_SKILL_DIR} paths → relative paths (portability)
        ~ Hardcoded tool names → harness-agnostic instructions

      REMOVED
        ✗ None

      NEW
        + Proper description with trigger words
        + Portable frontmatter (standard fields first)
      ```
    - IF: capabilities were lost unintentionally → restore them before proceeding

11. **Finalize**
    - Present the user with options:
      - **Replace**: delete original, rename refined to final name
      - **Keep both**: leave original and refined side by side for further comparison
      - **Rename only**: keep refined as-is with the suffix
    - IF: user chooses replace AND name is changing → confirm the old name is no longer referenced elsewhere
    - IF: related assets also need updating → note them for a separate refine pass
    - The user makes the final call — never auto-delete the original

## Error Handling

- IF: original skill is too complex to understand → ask the user to explain the intent
- IF: naming conflict with existing skill → discuss with user before renaming
- IF: related assets also need refining → note them for a separate pass, don't try to refine everything at once
- IF: user disagrees with rewrite direction → adjust based on their feedback, they know the use case best
