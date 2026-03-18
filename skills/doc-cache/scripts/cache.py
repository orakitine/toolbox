#!/usr/bin/env python3
"""
doc-cache — cache management CLI.

Usage:
  cache.py find <query>     Search cache by topic (filenames + frontmatter)
  cache.py list             List all cached docs with age and status
  cache.py clean            Remove expired entries
  cache.py stats            Show cache size and counts

Environment:
  CACHE_DIR         Override cache directory (default: ~/.claude/doc-cache/cache)
  MAX_AGE_DAYS      Override max age in days (default: 14)
"""

import os
import sys
from datetime import datetime
from pathlib import Path

CACHE_DIR = Path(os.environ.get("CACHE_DIR", str(Path.home() / ".claude" / "doc-cache")))
MAX_AGE = int(os.environ.get("MAX_AGE_DAYS", "14"))


def parse_frontmatter(path):
    """Parse YAML frontmatter from a markdown file. Returns dict."""
    meta = {}
    try:
        text = path.read_text()
    except Exception:
        return meta
    if not text.startswith("---"):
        return meta
    end = text.find("---", 3)
    if end < 0:
        return meta
    for line in text[3:end].strip().splitlines():
        if ":" not in line:
            continue
        key, val = line.split(":", 1)
        meta[key.strip()] = val.strip()
    return meta


def get_docs():
    """Return list of (path, frontmatter) for all cached docs."""
    if not CACHE_DIR.exists():
        return []
    docs = []
    for f in sorted(CACHE_DIR.glob("*.md")):
        docs.append((f, parse_frontmatter(f)))
    return docs


def age_days(date_str):
    """Days since a YYYY-MM-DD date string."""
    try:
        d = datetime.strptime(date_str, "%Y-%m-%d")
        return (datetime.now() - d).days
    except (ValueError, TypeError):
        return 999


def is_expired(meta):
    """Check if a doc is expired based on its fetched date."""
    fetched = meta.get("fetched", "")
    return age_days(fetched) > MAX_AGE


def cmd_find(query):
    """Search cache for docs matching query. Prints HIT/MISS."""
    if not query.strip():
        print("Usage: cache.py find <query>", file=sys.stderr)
        sys.exit(1)
    query_lower = query.lower()
    docs = get_docs()
    matches = []
    for path, meta in docs:
        searchable = " ".join([
            path.stem,
            meta.get("title", ""),
            meta.get("description", ""),
            meta.get("url", ""),
        ]).lower()
        if query_lower in searchable:
            matches.append((path, meta))

    if not matches:
        print("MISS")
        return

    for path, meta in matches:
        fetched = meta.get("fetched", "unknown")
        days = age_days(fetched)
        expired = is_expired(meta)
        status = "EXPIRED" if expired else "FRESH"
        print(f"HIT {path} ({days}d old, {status})")


def cmd_list():
    """List all cached docs with status."""
    docs = get_docs()
    if not docs:
        print("Cache is empty.")
        return

    fresh = 0
    expired = 0
    for path, meta in docs:
        fetched = meta.get("fetched", "?")
        days = age_days(fetched)
        title = meta.get("title", path.stem)
        exp = is_expired(meta)
        tag = "EXPIRED" if exp else "fresh"
        if exp:
            expired += 1
        else:
            fresh += 1
        print(f"  {path.stem}  ({days}d)  [{tag}]  {title}")

    print(f"\n{fresh} fresh, {expired} expired, {fresh + expired} total")


def cmd_clean():
    """Remove expired entries."""
    docs = get_docs()
    removed = 0
    for path, meta in docs:
        if is_expired(meta):
            path.unlink()
            print(f"  removed: {path.stem}")
            removed += 1

    remaining = len(docs) - removed
    print(f"\nRemoved {removed} expired entries. {remaining} docs remain.")


def cmd_stats():
    """Show cache stats."""
    docs = get_docs()
    total_size = sum(p.stat().st_size for p, _ in docs) if docs else 0
    fresh = sum(1 for _, m in docs if not is_expired(m))
    expired = len(docs) - fresh
    print(f"Location: {CACHE_DIR}")
    print(f"Docs: {len(docs)} ({fresh} fresh, {expired} expired)")
    print(f"Size: {total_size / 1024:.1f} KB")


COMMANDS = {
    "find": lambda args: cmd_find(" ".join(args)),
    "list": lambda args: cmd_list(),
    "clean": lambda args: cmd_clean(),
    "stats": lambda args: cmd_stats(),
}


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ("help", "--help"):
        print(__doc__.strip())
        sys.exit(0)

    cmd = sys.argv[1]
    if cmd not in COMMANDS:
        print(f"Unknown command: {cmd}", file=sys.stderr)
        sys.exit(1)

    COMMANDS[cmd](sys.argv[2:])


if __name__ == "__main__":
    main()
