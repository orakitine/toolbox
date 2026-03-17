# browser-review

Parallel UI validation that discovers user stories from YAML files, fans out browser-qa agents, and aggregates pass/fail results with screenshots.

## Quick Start

```
/browser-review
```

## Options

| Variable | Default | Description |
|---|---|---|
| HEADED | false | Show browser windows |
| VISION | false | Screenshot-as-image validation |
| STORIES_DIR | ai_review/user_stories | Directory containing YAML story files |
| AGENT_TIMEOUT | 300 | Seconds before agent timeout |
| FILENAME_FILTER | "" | Restrict to matching YAML filenames |

Pass `headed`, `vision`, or a filename filter as arguments.

## Prerequisites

- `browser` skill must be installed
- `browser-qa` agent must be installed
- `playwright-cli` must be available in PATH
- YAML story files must exist in STORIES_DIR

## Story File Format

```yaml
stories:
  - name: Front page loads
    url: https://yourapp.com
    workflow: |
      Navigate to URL
      Verify header is visible
      Check 10 items in the list
```

## Examples

- "/browser-review" — run all stories, headless
- "/browser-review headed" — run all stories with visible browser
- "/browser-review hackernews" — run only stories from hackernews.yaml
- "/browser-review headed vision hackernews" — all options combined

## Related

Part of the **browser** family. Highest-level orchestration skill.

| Asset | Type | Relationship |
|---|---|---|
| browser | skill | Required — core browser automation |
| browser-qa | agent | Required — each story runs in a browser-qa agent |
| browser-workflow | skill | Sibling — runs saved workflows (not user stories) |
| browser-operator | agent | Sibling — general browser sessions |

**Dependency chain:** browser-review → browser-qa → browser
