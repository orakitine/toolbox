# browser-workflow

Loads and executes saved browser automation workflows with consistent setup, teardown, and reporting.

## Quick Start

```
/browser-workflow
```

Lists available workflows. Then run one:

```
/browser-workflow blog-summarizer https://example.com
```

## Options

| Variable | Default | Description |
|---|---|---|
| WORKFLOWS_DIR | ${CLAUDE_SKILL_DIR}/workflows | Directory containing workflow .md files |
| OUTPUT_DIR | ./browser-automations | Where run artifacts are saved |

Pass `headed` or `vision` as arguments to override defaults. Extra text is injected into the workflow as a prompt.

## Prerequisites

- `browser` skill must be installed
- `playwright-cli` must be available in PATH
- Workflow files must exist in WORKFLOWS_DIR

## Workflow File Format

Workflow files are markdown files in WORKFLOWS_DIR. Optional YAML frontmatter for defaults:

```markdown
---
mode: headless
vision: false
---

Navigate to {{ url }}
Click the login button
Fill email with "test@example.com"
Fill password with "testpass123"
Take a screenshot of the dashboard
```

## Examples

- `/browser-workflow` — list available workflows
- `/browser-workflow blog-summarizer https://example.com` — run with injected URL
- `/browser-workflow price-check headed` — run with visible browser
- `/browser-workflow form-filler vision` — run with screenshot-as-image

## Related

Part of the **browser** family. Depends on the `browser` skill for all browser automation.

| Asset | Type | Relationship |
|---|---|---|
| browser | skill | Required — core browser automation |
| browser-review | skill | Sibling — parallel QA orchestration |
| browser-qa | agent | Sibling — QA validation for individual stories |
| browser-operator | agent | Sibling — general browser sessions |
