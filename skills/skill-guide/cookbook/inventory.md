# Inventory — What's Available

Scan and present all installed skills and agents grouped by family with dependency info.

## Workflow

1. **Collect All Assets**
   - Glob for skills: `<GLOBAL_SKILLS_DIR>/*/SKILL.md` and `<PROJECT_SKILLS_DIR>/*/SKILL.md`
   - Glob for agents: `<GLOBAL_AGENTS_DIR>/*.md` and `<PROJECT_AGENTS_DIR>/*.md`
   - For each: read YAML frontmatter to extract `name`, `description`, `color` (agents), `skills` (agents)
   - Tag each as "global" or "project"
   - IF: no SKILL.md or AGENT.md files found anywhere → report "No skills or agents installed. Use /registry to install some." and stop
   - IF: frontmatter is missing or malformed → skip that asset, note it as "[unreadable]" in output
   - Example: Found browser/SKILL.md in global → { name: "browser", description: "...", scope: "global" }
   - Tool: Glob, Read (first ~10 lines of each file for frontmatter)

2. **Group by Family**
   - Group assets by shared name prefix (e.g., `browser`, `browser-workflow`, `browser-qa` → browser family)
   - Assets with no shared prefix are standalone
   - IF: REGISTRY_YAML exists → read `requires` fields to enrich dependency info
   - Example: browser, browser-workflow, browser-review, browser-qa, browser-operator → "browser family (3 skills, 2 agents)"

3. **Build Dependency Chains**
   - IF: registry data available → parse `requires` fields to build dependency tree
   - IF: no registry → infer from agent `skills:` field and family prefixes
   - Example: browser-review requires [skill:browser, agent:browser-qa] → "browser-review → browser-qa → browser"

4. **Present Inventory**
   - Group by scope (project-level first, then global)
   - Within each scope, group by family
   - For each family: list members with type, one-liner description, color (agents)
   - Show dependency chain if available
   - Add "Start here" hint pointing to the core skill or simplest invocation
   - Format:
     ```
     INSTALLED SKILLS & AGENTS
     ═════════════════════════

     Project-level (.claude/skills/)
       (none installed)

     Global (~/.claude/skills/)

       browser family (3 skills, 2 agents)
         browser              Headless browser automation via playwright-cli
         browser-workflow     Run saved browser automation workflows
         browser-review       Parallel UI validation with user stories
         ├─ browser-qa        [agent, green] QA validation with pass/fail reports
         └─ browser-operator  [agent, orange] General browser automation
         Dependencies: browser-review → browser-qa → browser
         Start here: /browser [url]

       skill-forge
         skill-forge          Create, evaluate, and refine skills/agents
         Start here: /skill-forge create [name]

     Tip: /skill-guide <name> for details on any skill or family
     ```
   - Example: 6 skills + 2 agents installed → grouped into 2 families + standalone
