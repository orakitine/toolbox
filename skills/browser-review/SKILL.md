---
name: browser-review
description: Parallel UI validation that discovers user stories from YAML files, fans out browser-qa agents to test each story, and aggregates pass/fail results with screenshots. Use for acceptance testing, UI review, or regression testing across multiple user stories.
argument-hint: "[headed|vision] [filename-filter]"
allowed-tools:
  - Bash
  - Read
  - Glob
  - Agent
---

# Purpose

Discover user stories from YAML files, spawn parallel `browser-qa` agents to validate each story against a live web app, then aggregate and report structured pass/fail results with screenshots.

## Prerequisites

- `browser` skill must be installed
- `browser-qa` agent must be installed
- `playwright-cli` must be available in PATH
- YAML story files must exist in STORIES_DIR

## Variables

HEADED: false                           # Show browser windows. Derived from $ARGUMENTS if "headed" passed
VISION: false                           # Screenshot-as-image validation. Derived from $ARGUMENTS if "vision" passed
STORIES_DIR: ai_review/user_stories    # Directory containing YAML story files
AGENT_TIMEOUT: 300                      # Seconds before agent timeout
FILENAME_FILTER: ""                     # Restrict discovery to matching YAML filenames

## Workflow

1. **Parse Arguments**
   - Scan $ARGUMENTS for keywords (case-insensitive)
   - IF: "headed" → set HEADED=true
   - IF: "vision" → set VISION=true
   - Remaining text → set FILENAME_FILTER
   - Example: "headed hackernews" → HEADED=true, FILENAME_FILTER="hackernews"
   - Example: no args → all defaults (headless, no vision, all stories)

2. **Discover Stories**
   - Glob: `<STORIES_DIR>/*.yaml`
   - IF: FILENAME_FILTER is set → only include files matching filter
   - Parse each YAML → extract `stories` array
   - Count total stories across all files
   - Create timestamped run directory: `screenshots/browser-qa/<YYYY-MM-DD>_<HH-MM-SS>_<uuid>/`
   - IF: no stories found → report "No stories found in <STORIES_DIR>" and stop
   - Example: found `hackernews.yaml` with 3 stories → 3 agents needed
   - Tool: Glob, Bash

3. **Spawn Parallel Agents**
   - For each story, spawn a `browser-qa` agent using the Agent tool with `run_in_background: true`
   - Each agent gets:
     ```
     Execute this user story:

     **Story:** <story-name>
     **URL:** <story-url>
     **Headed:** <HEADED>
     **Vision:** <VISION>
     **Screenshots Directory:** <run-dir>/<source-file>/<story-slug>/

     **Workflow:**
     <story-workflow>
     ```
   - Launch ALL agents in a single message (parallel execution)
   - Example: 3 stories → 3 parallel Agent tool calls with `subagent_type: "browser-qa-agent"`
   - Tool: Agent

4. **Collect Results**
   - Wait for all agents to complete (use TaskOutput for each background agent)
   - Parse each agent's report for: PASS/FAIL status, step count, screenshot directory
   - Example: Agent 1 → "PASS 3/3 steps", Agent 2 → "FAIL 2/4 steps"
   - Tool: Agent (result collection)

5. **Generate Summary Report**
   - Format:
     ```
     UI REVIEW SUMMARY
     Run: <timestamp>
     Stories: <total> | Passed: <pass-count> | Failed: <fail-count>

     | # | Story | Source | Status | Steps | Screenshots |
     |---|-------|--------|--------|-------|-------------|
     | 1 | Front page loads | hackernews.yaml | PASS | 3/3 | path/ |
     | 2 | View comments | hackernews.yaml | FAIL | 2/3 | path/ |
     ```
   - IF: any failures → include full failure reports below the table
   - Report screenshot root directory for easy browsing
