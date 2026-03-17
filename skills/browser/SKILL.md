---
name: browser
description: Headless browser automation via playwright-cli for testing, screenshots, scraping, and parallel sessions. Use for UI testing, web scraping, screenshot capture, or any browser-based workflow.
argument-hint: "[url or task description]"
allowed-tools:
  - Bash
  - Read
---

# Purpose

Automate browsers using `playwright-cli`, a token-efficient CLI for Playwright. Runs headless by default, supports parallel sessions via named sessions (`-s=`), and persistent profiles for cookies/state.

## Prerequisites

- `playwright-cli` must be installed and available in PATH

## Variables

HEADED: false                     # Show browser window. Options: true, false
VISION: false                     # Return screenshots as images in context (higher token cost)
VIEWPORT_SIZE: 1440x900           # Browser viewport dimensions (WxH)
SCREENSHOTS_DIR: ./screenshots    # Where screenshots are saved

## Workflow

1. **Open Session**
   - IF: `which playwright-cli` fails → report "playwright-cli not found. Install it and ensure it's in PATH." and stop
   - Derive a short kebab-case session name from the task
   - Open with `--persistent` to preserve cookies/localStorage across commands
   - IF: HEADED is true → add `--headed` flag
   - IF: VISION is true → prefix with `PLAYWRIGHT_MCP_CAPS=vision`
   - Example: "test checkout on mystore.com" → `-s=mystore-checkout`
   - Tool: Bash
     ```
     PLAYWRIGHT_MCP_VIEWPORT_SIZE=<VIEWPORT_SIZE> playwright-cli -s=<session-name> open <url> --persistent
     ```

2. **Snapshot Page**
   - Capture element references to identify interactive elements
   - Returns refs (e.g., `e12`, `e45`) for click, fill, etc.
   - Example: `playwright-cli -s=mystore-checkout snapshot` → element tree with refs
   - Tool: Bash `playwright-cli -s=<session-name> snapshot`

3. **Interact with Elements**
   - Use refs from snapshot to click, fill, type, select, hover
   - For full command list: see `${CLAUDE_SKILL_DIR}/reference/commands.md`
   - Example: `playwright-cli -s=mystore-checkout click e12` → clicks element
   - Example: `playwright-cli -s=mystore-checkout fill e15 "test@example.com"` → fills input
   - Example: `playwright-cli -s=mystore-checkout press Enter` → presses key
   - Navigate: `goto <url>`, `go-back`, `go-forward`, `reload`
   - Tool: Bash `playwright-cli -s=<session-name> <command> <args>`

4. **Take Screenshots**
   - Capture current page state as PNG
   - IF: specific filename needed → use `--filename=<path>`
   - Example: `playwright-cli -s=mystore-checkout screenshot --filename=./screenshots/checkout-step1.png`
   - Tool: Bash `playwright-cli -s=<session-name> screenshot [--filename=<path>]`

5. **Close Session**
   - ALWAYS close the session when done — this is not optional
   - Example: `playwright-cli -s=mystore-checkout close`
   - To close ALL sessions: `playwright-cli close-all`
   - Tool: Bash `playwright-cli -s=<session-name> close`
