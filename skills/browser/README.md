# browser

Headless browser automation via playwright-cli for testing, screenshots, scraping, and parallel sessions.

## Quick Start

```
/browser https://example.com
```

## Options

| Variable | Default | Description |
|---|---|---|
| HEADED | false | Show browser window |
| VISION | false | Return screenshots as images in context (higher token cost) |
| VIEWPORT_SIZE | 1440x900 | Browser viewport dimensions (WxH) |
| SCREENSHOTS_DIR | ./screenshots | Where screenshots are saved |

## Prerequisites

- `playwright-cli` must be installed and available in PATH

## Examples

- "open mystore.com and screenshot the checkout page"
- "scrape all product prices from competitor.com"
- "fill out the contact form with test data and take a screenshot"
- "open three browser sessions in parallel to test different user flows"

## Related

Part of the **browser** family:

| Asset | Type | Relationship |
|---|---|---|
| browser-workflow | skill | Depends on this — loads and runs saved workflows |
| browser-review | skill | Depends on this — parallel UI validation across stories |
| browser-qa | agent (green) | Depends on this — QA validation with pass/fail reports |
| browser-operator | agent (orange) | Depends on this — general browser sessions, parallel-safe |

**Dependencies:** None (this is the core skill). All other browser family members depend on this.
