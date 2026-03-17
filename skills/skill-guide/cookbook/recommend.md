# Recommend — What Should I Use For This Task

Match a user's task description to the most relevant installed skills and agents. Read descriptions and README files to understand capabilities, then recommend the best approach.

## Workflow

1. **Understand the Task**
   - Parse the user's question or task description
   - Extract key concepts: what they want to do, what domain, what outcome
   - Example: "how do I test my UI" → concepts: testing, UI, validation, browser
   - Example: "I need to check code quality before pushing" → concepts: quality, linting, testing, pre-commit

2. **Match Against Installed Skills**
   - Read descriptions of all installed skills and agents (from frontmatter)
   - Score relevance: match task concepts against description words, README examples, family prefixes, and cookbook scenario names
   - IF: README.md exists for top matches → read Examples sections for more context
   - Rank by relevance
   - Example: "test my UI" → matches browser-review (UI validation), browser-qa (user story testing), browser (browser automation)

3. **Build Recommendation**
   - Present the top 1-3 most relevant skills/agents
   - For each recommendation:
     - Why it matches the task
     - Simplest way to start (quick start from README or frontmatter)
     - What it will do
     - Any prerequisites
   - IF: multiple skills work together → explain the composition
   - IF: no good match → say so honestly and suggest what kind of skill would help
   - Format:
     ```
     For UI testing, you have two options:

     1. Single story validation: browser-qa agent
        Spawn: Agent(subagent_type: "browser-qa-agent", prompt: "your story")
        Returns: structured PASS/FAIL report with screenshots
        Requires: playwright-cli, browser skill

     2. Multiple stories in parallel: browser-review skill
        /browser-review
        Discovers stories from YAML files, fans out browser-qa agents
        Requires: playwright-cli, browser skill, browser-qa agent, YAML story files

     Both use the browser skill under the hood for actual browser automation.
     Start with option 1 for a single test, option 2 for regression suites.
     ```
   - Example: "check code quality" → recommends quality-gate with quick start
   - Example: "automate filling out forms on a website" → recommends browser skill directly
