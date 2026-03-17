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

## Prerequisites

- `browser` skill must be installed
- `playwright-cli` must be available in PATH
- Workflow files must exist in WORKFLOWS_DIR

## Variables

WORKFLOWS_DIR: ${CLAUDE_SKILL_DIR}/workflows          # Directory containing workflow .md files
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

2. **Validate Workflow**
   - IF: no workflow specified → list available workflows and return
   - Check file exists: `<WORKFLOWS_DIR>/<workflow>.md`
   - IF: not found → report error with available names
   - Example: no args → "Available workflows: blog-summarizer, price-check"
   - Tool: Glob `<WORKFLOWS_DIR>/*.md`

3. **Load Workflow**
   - Read the workflow file
   - IF: file has YAML frontmatter → extract defaults for MODE, VISION
   - Command-line arguments override frontmatter defaults
   - IF: additional prompt set → inject into workflow content
   - Example: workflow says `mode: headed` but args say "headless" → use headless
   - Tool: Read `<WORKFLOWS_DIR>/<workflow>.md`

4. **Execute Workflow**
   - Apply HEADED and VISION settings to the browser skill
   - Create output directory: `<OUTPUT_DIR>/<workflow>_<timestamp>/`
   - Run the workflow content using the browser skill (open → snapshot → interact → screenshot → close)
   - Save screenshots and artifacts to output directory
   - Example: `mkdir -p ./browser-automations/blog-summarizer_2026-03-17_19-30/`
   - Tool: Bash

5. **Report Results**
   - Summarize: workflow name, mode, outcome, output directory, screenshot list, any errors
   - Example:
     ```
     WORKFLOW COMPLETE
     Workflow: blog-summarizer
     Mode: headless
     Output: ./browser-automations/blog-summarizer_2026-03-17_19-30/
     Result: Successfully summarized 1 blog post
     ```
