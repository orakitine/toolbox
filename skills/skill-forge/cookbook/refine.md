# Refine an Existing Skill

Rewrite an existing skill, agent, or command to meet current principles. Understands intent first, rewrites from scratch, then validates. Assumes PRINCIPLES.md is already loaded (SKILL.md Step 2).

## Variables

OUTPUT_SUFFIX: -refined                     # Suffix appended to original dir name for the rewrite

## Workflow

1. **Read the Original Completely**
   - Locate the skill from user input (path, name, or search)
   - Read SKILL.md (or AGENT.md, or command file)
   - Read ALL cookbooks, references, scripts, templates — everything in the directory
   - Read any related agents or commands that work with this skill
   - Note the full directory structure and parent directory
   - Example: Read `~/.claude/skills/playwright-browser/SKILL.md` → single file, no cookbooks
   - Example: Read `~/.claude/skills/doc-vault/SKILL.md` + 3 cookbooks + cache/ + README.md → complex skill

2. **Understand: Intent and Purpose**
   - What is this skill trying to accomplish? What problem does it solve?
   - Who uses it and when? What triggers it?
   - Capture the GOAL, not the implementation details
   - Example: playwright-browser → "automates headless browsers for testing, scraping, and screenshots"
   - Example: doc-vault → "caches API documentation locally so Claude has fresh, accurate references"

3. **Understand: Caveats and Side Effects**
   - Does this skill modify files, send messages, cost money?
   - Are there edge cases or failure modes the original handles?
   - What assumptions does it make about the environment?
   - Example: doc-vault auto-triggers on doc keywords — could be noisy if too aggressive
   - Example: fork-terminal launches new processes — has side effects

4. **Understand: Relationships**
   - Does this skill work with specific agents?
   - Does it depend on other skills or tools?
   - Is it part of a family (browser skill + browser-qa agent + browser commands)?
   - Are other skills or agents expecting this one to exist?
   - Example: playwright-browser → has browser-qa-agent and browser-automation-agent, plus browser/run-workflow and browser/ui-review commands
   - Example: elevenlabs → has elevenlabs-agent and voice-designer-agent

5. **Rewrite from Principles**
   - Create a new directory next to the original: `<original-name><OUTPUT_SUFFIX>/`
   - IF: user specified an output path → use that instead
   - Start fresh — do NOT patch the old skill
   - Apply naming conventions: does the name need to change? (capability over implementation)
   - Write new frontmatter following current conventions
   - Write new Purpose section
   - Design new workflow with proper structure (bold steps, inline examples, IF/THEN)
   - Create cookbooks if branching logic exists
   - Move heavy reference material to reference/ directory
   - The original remains untouched — it is the reference copy
   - Example: `playwright-browser/` untouched → `playwright-browser-refined/` created next to it
   - Example: `doc-vault/` untouched → `doc-vault-refined/` created next to it

6. **Show the Diff**
   - Present the rewrite to the user
   - Highlight key changes: renamed? restructured? cookbooks added/removed?
   - Show before/after for the most significant sections
   - Ask the user to review before proceeding
   - Example: "Proposing rename playwright-browser → browser. Moved run-workflow and ui-review from commands into cookbooks. Added proper frontmatter with description."

7. **Evaluate + Fix Loop**
   - Run `/skill-forge evaluate inline` against the NEW version
   - This routes through SKILL.md's own evaluation workflow — no cross-cookbook reference
   - IF: issues found → fix them
   - Repeat until evaluation passes clean (0 critical, 0 warning)
   - Example: First pass finds missing inline example in step 3 → add it → recheck → clean

8. **Fresh-Eyes Critique**
   - Spawn a subagent using the Agent tool to review the migration
   - Pass it: the original skill content, the refined skill content, and PRINCIPLES.md
   - Task: "Compare these two versions. Is the rewrite faithful to the original's intent? Any capabilities lost? Any improvements missed? Is the new version following principles correctly?"
   - The agent returns an independent critique
   - IF: agent identifies issues → fix them before proceeding

9. **Compare for Regression**
   - Compare original capabilities against rewritten version
   - For each workflow step or feature in the original:
     - Is it preserved in the new version?
     - If removed, was it intentional? (document why)
     - If changed, does the new approach cover the same cases?
   - Check: any cookbooks, scripts, or templates in the original that weren't carried over?
   - Check: any edge cases or error handling that was lost?
   - Present a capability comparison:
     ```
     CAPABILITY COMPARISON: playwright-browser → browser
     ═══════════════════════════════════════════════════

     PRESERVED
       ✓ Headless browser automation
       ✓ Screenshot capture
       ✓ UI review workflow
       ✓ Parallel session support

     CHANGED
       ~ run-workflow command → cookbook/run-workflow.md (same capability, better structure)
       ~ ui-review command → cookbook/ui-review.md

     REMOVED
       ✗ None

     NEW
       + Proper frontmatter with description and allowed-tools
       + IF/THEN/EXAMPLES cookbook routing
     ```
   - IF: capabilities were lost unintentionally → restore them before proceeding

10. **Finalize**
    - Present the user with options:
      - **Replace**: delete original, rename refined to final name (e.g., `browser/`)
      - **Keep both**: leave original and refined side by side for further comparison
      - **Rename only**: keep refined as-is with the `-refined` suffix
    - IF: user chooses replace AND name is changing → confirm the old name is no longer referenced elsewhere
    - IF: related agents/commands also need updating → note them for a separate refine pass
    - The user makes the final call — never auto-delete the original

## Error Handling

- IF: original skill is too complex to understand → ask the user to explain the intent
- IF: naming conflict with existing skill → discuss with user before renaming
- IF: related agents/commands also need refining → note them for a separate pass, don't try to refine everything at once
- IF: user disagrees with rewrite direction → adjust based on their feedback, they know the use case best
