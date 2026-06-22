---
name: browser-workflow
description: Executes saved browser automation workflows with consistent setup, teardown, and reporting. Loads workflow files and runs them through the browser skill. Use for repeatable browser automations like scraping, form-filling, or monitoring.
argument-hint: "[workflow-name] [headed|vision] [extra prompt]"
allowed-tools:
  - Bash
  - Read
  - Glob
---

# Purpose

Higher-order skill that loads saved browser automation workflows from a directory and executes them through the `browser` skill. Think of it as a function that takes a workflow file as a parameter, with consistent setup, teardown, and reporting.

## Variables

WORKFLOWS_DIR: ./workflows                            # Directory containing workflow .md files
OUTPUT_DIR: ./browser-automations                     # Where run artifacts are saved

## Workflow

1. **Parse Arguments**
   - First argument → workflow name
   - Scan remaining for keywords (case-insensitive):
     - IF: "headed" → set HEADED=true
     - IF: "headless" → set HEADED=false (explicit override)
     - IF: "vision" → set VISION=true
     - Remaining text → additional prompt to inject into workflow
   - Example: "blog-summarizer https://example.com headed" → workflow=blog-summarizer, HEADED=true, prompt="https://example.com"

2. **Validate Environment**
   - IF: `browser` skill is not installed → report "browser skill required but not found" and stop
   - IF: `which playwright-cli` fails → report "playwright-cli not found. Install it and ensure it's in PATH." and stop
   - IF: WORKFLOWS_DIR does not exist → report "No workflows directory at WORKFLOWS_DIR" and stop
   - Example: missing playwright-cli → "Error: playwright-cli not found. Install it and ensure it's in PATH."

3. **Validate Workflow**
   - IF: no workflow specified → list available workflows and return
   - Check file exists: `<WORKFLOWS_DIR>/<workflow>.md`
   - IF: not found → report error with available names
   - Example: no args → "Available workflows: blog-summarizer, price-check"
   - Tool: Glob `<WORKFLOWS_DIR>/*.md`

4. **Load Workflow**
   - Read the workflow file
   - IF: file has YAML frontmatter → extract defaults for MODE, VISION
   - Command-line arguments override frontmatter defaults
   - IF: additional prompt set → inject into workflow content
   - Example: workflow says `mode: headed` but args say "headless" → use headless
   - Tool: Read `<WORKFLOWS_DIR>/<workflow>.md`

5. **Execute Workflow**
   - Apply HEADED and VISION settings to the browser skill
   - Create output directory: `<OUTPUT_DIR>/<workflow>_<timestamp>/`
   - Run the workflow content using the browser skill (open → snapshot → interact → screenshot → close)
   - Save screenshots and artifacts to output directory
   - Example: `mkdir -p ./browser-automations/blog-summarizer_2026-03-17_19-30/`
   - Tool: Bash

6. **Report Results**
   - Summarize: workflow name, mode, outcome, output directory, screenshot list, any errors
   - Example:
     ```
     WORKFLOW COMPLETE
     Workflow: blog-summarizer
     Mode: headless
     Output: ./browser-automations/blog-summarizer_2026-03-17_19-30/
     Result: Successfully summarized 1 blog post
     ```

## Workflow File Format

Workflow files are markdown in WORKFLOWS_DIR. Optional YAML frontmatter sets defaults that command-line arguments can override:

```markdown
---
mode: headless
vision: false
---

Navigate to {{ url }}
Click the login button
Fill email with "test@example.com"
Take a screenshot of the dashboard
```

## Family

Part of the **browser** family. Depends on `browser` for all browser automation.

- `browser` — core browser automation (required dependency)
- `browser-review` — parallel QA orchestration (sibling)
- `browser-qa` — QA validation agent for individual stories (sibling)
- `browser-operator` — general browser session agent (sibling)

## Works well with

Optional collaborators — `browser-workflow` runs standalone and these degrade gracefully if absent.

- **`browser`** — executes the loaded workflow steps through this underlying capability.
