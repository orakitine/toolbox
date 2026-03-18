---
name: doc-cache
description: Transparent read-through cache for documentation lookups. Checks cache before WebFetch, caches results with expiration, garbage collects stale entries. Use automatically when fetching docs, API references, or technical documentation.
argument-hint: "[topic | clean | list | stats]"
allowed-tools:
  - Bash
  - Read
  - Write
  - WebFetch
  - WebSearch
---

# Purpose

Transparent caching layer for documentation lookups. Before fetching docs from the web, check the cache. On miss or expiry, fetch live and cache the result. Saves compute, tokens, and time on repeated lookups.

## Prerequisites

- `python3` must be available in PATH (stdlib only)

## Variables

CACHE_DIR: ~/.claude/doc-cache/cache                              # Where cached docs live
CACHE_TOOL: python3 ${CLAUDE_SKILL_DIR}/scripts/cache.py   # Cache management CLI
MAX_AGE_DAYS: 14                                            # Cache expiration in days

## Workflow

1. **Check Cache**
   - Search for a cached doc matching the topic: `<CACHE_TOOL> find "<topic>"`
   - The tool searches filenames and frontmatter (url, title, description) for matches
   - IF: hit and fresh (within MAX_AGE_DAYS) → go to step 4
   - IF: hit but expired → go to step 2 (re-fetch)
   - IF: miss → go to step 2
   - Example: `<CACHE_TOOL> find "tanstack router"` → `HIT ~/.claude/doc-cache/cache/tanstack-router-api.md (3 days old)`
   - Example: `<CACHE_TOOL> find "stripe webhooks"` → `MISS`
   - Tool: Bash

2. **Fetch Live**
   - Use WebFetch to grab the documentation from the web
   - IF: URL known → fetch directly
   - IF: only topic known → WebSearch first to find the right docs page, then WebFetch
   - Example: WebFetch `https://tanstack.com/router/latest/docs/framework/react/api` → markdown content
   - Tool: WebFetch

3. **Cache the Result**
   - Save to `<CACHE_DIR>/<slug>.md` with frontmatter:
     ```
     ---
     url: <source URL>
     fetched: <YYYY-MM-DD>
     expires: <YYYY-MM-DD>
     title: <page title>
     description: <one-line summary>
     ---
     <content>
     ```
   - Slug derived from topic: lowercase, hyphens, no special chars (e.g. "TanStack Router API" → `tanstack-router-api`)
   - IF: updating expired entry → overwrite the existing file
   - Example: Save to `~/.claude/doc-cache/cache/tanstack-router-api.md`
   - Tool: Write

4. **Read and Use**
   - Read the cached file and use it as authoritative reference
   - Cite the source: "Per [title] docs (cached YYYY-MM-DD from URL)..."
   - Example: Read `~/.claude/doc-cache/cache/tanstack-router-api.md` → answer user's question
   - Tool: Read

5. **Garbage Collect (On Request)**
   - IF: user asks to clean up, or cache grows large
   - Run: `<CACHE_TOOL> clean` — removes all expired entries
   - Run: `<CACHE_TOOL> list` — shows cached docs with age and status
   - Example: `<CACHE_TOOL> clean` → `Removed 3 expired entries. 8 docs remain.`
   - Tool: Bash
