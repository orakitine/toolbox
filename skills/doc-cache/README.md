# doc-cache

Transparent read-through cache for documentation lookups. Saves tokens and time on repeated doc fetches.

## Quick Start

Just use Claude normally — when docs are needed, the cache is checked automatically before fetching from the web.

```
"what's the TanStack Router API for route params?"
→ cache miss → WebFetch → cached → answered

"show me TanStack Router's useParams hook"
→ cache hit (3 days old) → answered instantly, no fetch needed
```

## Options

| Variable | Default | Description |
|---|---|---|
| CACHE_DIR | ~/.claude/doc-cache/cache | Where cached docs live |
| MAX_AGE_DAYS | 14 | Cache expiration in days |

## Cache Management

- `"clean up the doc cache"` — garbage collect expired entries
- `"what's in the doc cache?"` — list cached docs with age and status
- `"doc cache stats"` — show cache size and counts

## How It Works

1. You ask about docs / API reference
2. Claude checks the cache for a match
3. **Hit + fresh** → reads cached version (no fetch, no tokens burned)
4. **Miss or expired** → fetches live via WebFetch, caches the result
5. Cached docs expire after 14 days (configurable)

## Prerequisites

- `python3` in PATH (stdlib only, no pip packages)
