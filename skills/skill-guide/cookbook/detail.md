# Detail — Tell Me About This Skill

Deep dive on a specific skill, agent, or family. Reads README.md (human docs) and SKILL.md/AGENT.md (technical spec) to build a comprehensive explanation.

## Workflow

1. **Find the Asset**
   - Search by name across global and project directories
   - IF: exact match → use it
   - IF: prefix match (e.g., "browser" matches browser, browser-workflow, browser-qa) → show the whole family
   - IF: no match → report "not found" and list similar names
   - Example: "browser" → finds browser/SKILL.md + all browser-* family members
   - Tool: Glob `<GLOBAL_SKILLS_DIR>/<name>*/SKILL.md`, `<GLOBAL_AGENTS_DIR>/<name>*.md`

2. **Read Documentation**
   - IF: README.md exists → read it (primary source for human-friendly info)
   - Read SKILL.md or AGENT.md frontmatter + Purpose/Role section
   - IF: skill has cookbooks → read cookbook routing section for available modes
   - IF: skill has Variables → extract options table
   - IF: skill has Prerequisites → extract requirements
   - Example: browser has README.md → read for quick start, options, examples, related
   - Tool: Read

3. **Read Family Context**
   - IF: asset is part of a family (prefix match found other members) → read their descriptions too
   - IF: REGISTRY_YAML exists → read dependency info for the family
   - IF: agent has `skills:` field → note which skill it uses
   - Example: "browser-qa" → part of browser family, depends on browser skill, used by browser-review

4. **Present Detail**
   - IF: single skill/agent → show full detail:
     ```
     BROWSER
     ═══════

     Headless browser automation via playwright-cli for testing,
     screenshots, scraping, and parallel sessions.

     Quick Start: /browser https://example.com

     Options:
       HEADED          false       Show browser window
       VISION          false       Screenshots as images (higher token cost)
       VIEWPORT_SIZE   1440x900    Browser dimensions
       SCREENSHOTS_DIR ./screenshots  Where screenshots go

     Prerequisites:
       - playwright-cli must be installed and in PATH

     Examples:
       - "open mystore.com and screenshot the checkout page"
       - "scrape all product prices from competitor.com"

     Family: browser (3 skills, 2 agents)
       browser-workflow     Run saved browser workflows
       browser-review       Parallel UI validation
       browser-qa [agent]   QA with pass/fail reports
       browser-operator [agent]  General browser sessions

     Dependencies: none (this is the core skill)
     ```

   - IF: family query (prefix matches multiple) → show family overview:
     ```
     BROWSER FAMILY (3 skills, 2 agents)
     ════════════════════════════════════

     Core: browser
       /browser [url or task]
       Headless browser automation via playwright-cli

     Orchestration:
       browser-workflow    /browser-workflow [name] [headed|vision]
       browser-review      /browser-review [headed|vision] [filter]

     Agents:
       browser-operator [orange]   General browser sessions (parallel-safe)
       browser-qa [green]          QA validation with pass/fail reports

     Dependency chain: browser-review → browser-qa → browser

     Tip: /skill-guide <member-name> for full details on any member
     ```
