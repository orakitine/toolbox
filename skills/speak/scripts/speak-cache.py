#!/usr/bin/env python3
"""
speak-cache — TTS audio cache manager.

Usage:
  speak-cache.py find "<text>" [--voice V] [--model M] [--speed S]
  speak-cache.py store "<text>" --file <path> [--voice V] [--model M] [--speed S]
  speak-cache.py bump "<text>" [--voice V] [--model M] [--speed S]
  speak-cache.py list
  speak-cache.py stats
  speak-cache.py clean
  speak-cache.py evict "<text>" [--voice V] [--model M] [--speed S]

Environment:
  CACHE_DIR           Override cache directory (default: ~/.claude/speak-cache)
  MAX_CACHE_SIZE_MB   Override max cache size in MB (default: 100)
"""

import hashlib
import json
import os
import shutil
import sys
from datetime import datetime
from pathlib import Path

CACHE_DIR = Path(os.environ.get("CACHE_DIR", str(Path.home() / ".claude" / "speak-cache")))
AUDIO_DIR = CACHE_DIR / "audio"
MANIFEST = CACHE_DIR / "manifest.json"
MAX_CACHE_SIZE = int(os.environ.get("MAX_CACHE_SIZE_MB", "100")) * 1024 * 1024

# Defaults matching the speak skill
DEFAULT_VOICE = "pNInz6obpgDQGcFmaJgB"
DEFAULT_MODEL = "eleven_multilingual_v2"
DEFAULT_SPEED = "1.15"


def normalize_text(text):
    """Normalize text for consistent cache keys."""
    return " ".join(text.strip().lower().split())


def safe_speed(speed):
    """Normalize speed to consistent decimal format."""
    try:
        return f"{float(speed):.2f}"
    except (ValueError, TypeError):
        return f"{float(DEFAULT_SPEED):.2f}"


def compute_key(text, voice, model, speed):
    """Compute cache key from text + generation params."""
    normalized = normalize_text(text)
    blob = f"{normalized}|{voice}|{model}|{safe_speed(speed)}"
    return hashlib.sha256(blob.encode()).hexdigest()[:16]


def load_manifest():
    """Load manifest from disk. Returns empty dict on any error."""
    try:
        return json.loads(MANIFEST.read_text())
    except Exception:
        return {}


def save_manifest(data):
    """Atomically write manifest to disk."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    tmp = MANIFEST.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, indent=2))
    tmp.rename(MANIFEST)


def today():
    return datetime.now().strftime("%Y-%m-%d")


def total_cache_size(manifest):
    """Sum of all cached audio file sizes."""
    return sum(e.get("size", 0) for e in manifest.values())


def eviction_score(entry):
    """Higher score = keep longer. Combines hit count with recency."""
    hits = entry.get("hits", 0)
    try:
        last = datetime.strptime(entry.get("last_used", "2000-01-01"), "%Y-%m-%d")
        days_ago = (datetime.now() - last).days
    except ValueError:
        days_ago = 9999
    # Recency bonus: recent items get a boost, decays over 30 days
    recency = max(0, 30 - days_ago) / 30.0
    return hits + recency * 10


def parse_flags(args):
    """Parse --flag value pairs and positional args."""
    flags = {}
    positional = []
    i = 0
    while i < len(args):
        if args[i].startswith("--") and i + 1 < len(args):
            flags[args[i][2:]] = args[i + 1]
            i += 2
        else:
            positional.append(args[i])
            i += 1
    return flags, positional


def extract_text_and_params(args):
    """Common extraction of text + voice/model/speed from args."""
    flags, positional = parse_flags(args)
    text = positional[0] if positional else None
    voice = flags.get("voice", DEFAULT_VOICE)
    model = flags.get("model", DEFAULT_MODEL)
    speed = flags.get("speed", DEFAULT_SPEED)
    return text, voice, model, speed, flags


def maybe_evict(manifest):
    """Evict LRU entries if cache exceeds MAX_CACHE_SIZE. Returns removal count."""
    size = total_cache_size(manifest)
    if size <= MAX_CACHE_SIZE:
        return 0

    entries = sorted(manifest.items(), key=lambda kv: eviction_score(kv[1]))
    removed = 0
    freed = 0
    while size > MAX_CACHE_SIZE and entries:
        key, entry = entries.pop(0)
        audio_path = AUDIO_DIR / f"{key}.mp3"
        file_size = entry.get("size", 0)
        if audio_path.exists():
            audio_path.unlink()
        del manifest[key]
        size -= file_size
        freed += file_size
        removed += 1

    if removed:
        print(f"Cache cleaned: removed {removed} entries, freed {freed / 1024:.1f} KB")

    return removed


# --- Commands ---


def cmd_find(args):
    """Read-only cache lookup. Prints HIT <path> or MISS. Does not mutate state."""
    text, voice, model, speed, _ = extract_text_and_params(args)
    if not text:
        print("Usage: speak-cache.py find \"<text>\" [--voice V] [--model M] [--speed S]",
              file=sys.stderr)
        sys.exit(1)

    key = compute_key(text, voice, model, speed)
    manifest = load_manifest()
    entry = manifest.get(key)

    if entry and (AUDIO_DIR / f"{key}.mp3").exists():
        print(f"HIT {AUDIO_DIR / f'{key}.mp3'}")
        return

    print("MISS")


def cmd_bump(args):
    """Record a cache hit after successful playback."""
    text, voice, model, speed, _ = extract_text_and_params(args)
    if not text:
        print("Usage: speak-cache.py bump \"<text>\" [--voice V] [--model M] [--speed S]",
              file=sys.stderr)
        sys.exit(1)

    key = compute_key(text, voice, model, speed)
    manifest = load_manifest()
    entry = manifest.get(key)

    if entry:
        entry["hits"] = entry.get("hits", 0) + 1
        entry["last_used"] = today()
        save_manifest(manifest)
        print(f"BUMPED {key} ({entry['hits']} hits)")
    else:
        print("NOT_FOUND")


def cmd_store(args):
    """Store an audio file in the cache."""
    text, voice, model, speed, flags = extract_text_and_params(args)
    if not text or "file" not in flags:
        print("Usage: speak-cache.py store \"<text>\" --file <path> [--voice V] [--model M] [--speed S]",
              file=sys.stderr)
        sys.exit(1)

    source = Path(flags["file"])
    if not source.exists():
        print(f"Source file not found: {source}", file=sys.stderr)
        sys.exit(1)

    key = compute_key(text, voice, model, speed)
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    dest = AUDIO_DIR / f"{key}.mp3"
    shutil.copy2(str(source), str(dest))

    manifest = load_manifest()
    manifest[key] = {
        "text": text,
        "voice": voice,
        "model": model,
        "speed": speed,
        "created": today(),
        "last_used": today(),
        "hits": 0,
        "size": dest.stat().st_size,
    }
    maybe_evict(manifest)
    save_manifest(manifest)
    print(f"STORED {key}")


def cmd_list(_):
    """List all cached entries."""
    manifest = load_manifest()
    if not manifest:
        print("Cache is empty.")
        return

    for key, entry in sorted(manifest.items(), key=lambda kv: -kv[1].get("hits", 0)):
        text = entry.get("text", "?")
        hits = entry.get("hits", 0)
        size = entry.get("size", 0)
        last = entry.get("last_used", "?")
        display = text if len(text) <= 50 else text[:47] + "..."
        print(f"  {key}  {hits:>4} hits  {size / 1024:>6.1f}KB  {last}  \"{display}\"")

    total = total_cache_size(manifest)
    print(f"\n{len(manifest)} entries, {total / 1024:.1f} KB total")


def cmd_stats(_):
    """Show cache statistics."""
    manifest = load_manifest()
    total = total_cache_size(manifest)
    total_hits = sum(e.get("hits", 0) for e in manifest.values())

    print(f"Location:  {CACHE_DIR}")
    print(f"Entries:   {len(manifest)}")
    print(f"Size:      {total / 1024 / 1024:.2f} MB / {MAX_CACHE_SIZE / 1024 / 1024:.0f} MB")
    print(f"Hits:      {total_hits} total")

    if manifest:
        top = sorted(manifest.items(), key=lambda kv: -kv[1].get("hits", 0))[:5]
        print("\nTop entries:")
        for _, entry in top:
            print(f"  {entry.get('hits', 0):>4} hits  \"{entry.get('text', '?')}\"")


def cmd_clean(_):
    """Evict LRU entries to fit within MAX_CACHE_SIZE and remove orphans."""
    manifest = load_manifest()
    if not manifest:
        print("Cache is empty.")
        return

    # Remove orphaned entries (manifest entry but no audio file)
    orphaned = 0
    for key in list(manifest.keys()):
        if not (AUDIO_DIR / f"{key}.mp3").exists():
            del manifest[key]
            orphaned += 1

    if orphaned:
        print(f"Removed {orphaned} orphaned entries.")

    removed = maybe_evict(manifest)
    if orphaned or removed:
        save_manifest(manifest)
    else:
        total = total_cache_size(manifest)
        print(f"Nothing to clean. {len(manifest)} entries, {total / 1024:.1f} KB"
              f" / {MAX_CACHE_SIZE / 1024 / 1024:.0f} MB limit.")


def cmd_evict(args):
    """Remove a specific entry by text + params."""
    text, voice, model, speed, _ = extract_text_and_params(args)
    if not text:
        print("Usage: speak-cache.py evict \"<text>\" [--voice V] [--model M] [--speed S]",
              file=sys.stderr)
        sys.exit(1)

    key = compute_key(text, voice, model, speed)
    manifest = load_manifest()

    if key in manifest:
        audio_path = AUDIO_DIR / f"{key}.mp3"
        if audio_path.exists():
            audio_path.unlink()
        del manifest[key]
        save_manifest(manifest)
        print(f"EVICTED {key}")
    else:
        print("NOT_FOUND")


COMMANDS = {
    "find": cmd_find,
    "store": cmd_store,
    "bump": cmd_bump,
    "list": cmd_list,
    "stats": cmd_stats,
    "clean": cmd_clean,
    "evict": cmd_evict,
}


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ("help", "--help", "-h"):
        print(__doc__.strip())
        sys.exit(0)

    cmd = sys.argv[1]
    if cmd not in COMMANDS:
        print(f"Unknown command: {cmd}", file=sys.stderr)
        print(f"Available: {', '.join(COMMANDS)}", file=sys.stderr)
        sys.exit(1)

    COMMANDS[cmd](sys.argv[2:])


if __name__ == "__main__":
    main()
