#!/usr/bin/env python3
"""
el — a thin CLI wrapper around the ElevenLabs REST API.

Designed to be driven by Claude Code skills.
All output is human-readable by default, JSON with --json.

Usage: python3 el.py <command> [options]

Environment: ELEVENLABS_API_KEY (required)

Key resolution order:
  1. ELEVENLABS_API_KEY in environment (explicit export, CI, etc.)
  2. ./.env in current working directory
  3. ~/.claude/.env (global fallback for personal keys)
"""

import sys
import os
import json
import urllib.request
import urllib.parse
import urllib.error
from pathlib import Path

API_BASE = "https://api.elevenlabs.io"


# ── .env loading ──────────────────────────────────────────────────────────────

def load_env(path):
    if not os.path.exists(path):
        return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, val = line.split("=", 1)
            key = key.strip()
            val = val.strip().strip("\"'")
            if key not in os.environ:
                os.environ[key] = val


# Load .env files: project first, then global fallback
load_env(".env")
load_env(os.path.join(Path.home(), ".claude", ".env"))


# ── Helpers ───────────────────────────────────────────────────────────────────

def get_api_key():
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        print("Error: ELEVENLABS_API_KEY not set", file=sys.stderr)
        print("Set it in one of:", file=sys.stderr)
        print("  1. Environment variable (export ELEVENLABS_API_KEY=...)", file=sys.stderr)
        print("  2. ./.env (project-level)", file=sys.stderr)
        print("  3. ~/.claude/.env (global fallback)", file=sys.stderr)
        sys.exit(1)
    return key


def parse_args(args):
    flags = {}
    positional = []
    i = 0
    while i < len(args):
        arg = args[i]
        if arg.startswith("--"):
            key = arg[2:]
            if i + 1 < len(args) and not args[i + 1].startswith("--"):
                flags[key] = args[i + 1]
                i += 2
            else:
                flags[key] = "true"
                i += 1
        else:
            positional.append(arg)
            i += 1
    return flags, positional


def api_get(path, params=None):
    url = API_BASE + path
    if params:
        qs = urllib.parse.urlencode({k: v for k, v in params.items() if v})
        url += "?" + qs

    req = urllib.request.Request(url, headers={"xi-api-key": get_api_key()})
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read())
    except urllib.error.HTTPError as e:
        print(f"API error {e.code}: {e.read().decode()}", file=sys.stderr)
        sys.exit(1)


def api_post_json(path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        API_BASE + path,
        data=data,
        headers={
            "xi-api-key": get_api_key(),
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        return urllib.request.urlopen(req)
    except urllib.error.HTTPError as e:
        print(f"API error {e.code}: {e.read().decode()}", file=sys.stderr)
        sys.exit(1)


def api_post_file(path, file_path, field_name="audio"):
    boundary = "----ElevenLabsBoundary"
    filename = os.path.basename(file_path)

    with open(file_path, "rb") as f:
        file_data = f.read()

    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'
        f"Content-Type: application/octet-stream\r\n\r\n"
    ).encode() + file_data + f"\r\n--{boundary}--\r\n".encode()

    req = urllib.request.Request(
        API_BASE + path,
        data=body,
        headers={
            "xi-api-key": get_api_key(),
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        method="POST",
    )
    try:
        return urllib.request.urlopen(req)
    except urllib.error.HTTPError as e:
        print(f"API error {e.code}: {e.read().decode()}", file=sys.stderr)
        sys.exit(1)


def write_audio(response, out_path):
    data = response.read()
    with open(out_path, "wb") as f:
        f.write(data)
    kb = len(data) / 1024
    print(f"✓ {out_path} ({kb:.1f} KB)")


# ── Commands ──────────────────────────────────────────────────────────────────

def cmd_models(flags):
    data = api_get("/v1/models")
    models = [m for m in data if m.get("can_do_text_to_speech")]

    if "json" in flags:
        print(json.dumps(models, indent=2))
        return

    print("Available TTS Models:\n")
    for m in models:
        langs = len(m.get("languages", []))
        cost = m.get("model_rates", {}).get("character_cost_multiplier", "?")
        print(f"  {m['model_id']}")
        print(f"    {m['name']} — {langs} languages, cost: {cost}x")
        desc = m.get("description", "")
        if desc:
            print(f"    {desc.split(chr(10))[0][:100]}")
        print()


def cmd_voices(flags):
    params = {"page_size": flags.get("limit", "20")}
    if "search" in flags:
        params["search"] = flags["search"]
    if "category" in flags:
        params["category"] = flags["category"]
    if "sort" in flags:
        params["sort"] = flags["sort"]
    if "type" in flags:
        params["voice_type"] = flags["type"]

    data = api_get("/v2/voices", params)

    if "json" in flags:
        print(json.dumps(data, indent=2))
        return

    voices = data.get("voices", [])
    print(f"Voices ({len(voices)} results):\n")
    for v in voices:
        labels = ", ".join(f"{k}:{val}" for k, val in v.get("labels", {}).items()) if v.get("labels") else ""
        print(f"  {v['voice_id']}  {v['name']}")
        if v.get("category"):
            print(f"    category: {v['category']}")
        if labels:
            print(f"    labels: {labels}")
        if v.get("description"):
            print(f"    {v['description'][:120]}")
        print()

    if data.get("has_more"):
        print("  ... more results available (use --limit or --json for pagination)")


def cmd_voice_get(flags, positional):
    voice_id = positional[0] if positional else flags.get("id")
    if not voice_id:
        print("Usage: el voice <voice_id>", file=sys.stderr)
        sys.exit(1)

    data = api_get(f"/v1/voices/{voice_id}")

    if "json" in flags:
        print(json.dumps(data, indent=2))
        return

    print(f"Voice: {data['name']} ({data['voice_id']})")
    print(f"  category: {data.get('category', 'unknown')}")
    if data.get("description"):
        print(f"  description: {data['description']}")
    if data.get("labels"):
        labels = ", ".join(f"{k}:{v}" for k, v in data["labels"].items())
        print(f"  labels: {labels}")
    if data.get("settings"):
        s = data["settings"]
        print(f"  settings: stability={s.get('stability')}, similarity={s.get('similarity_boost')}, style={s.get('style', 'n/a')}, speed={s.get('speed', 1.0)}")
    if data.get("preview_url"):
        print(f"  preview: {data['preview_url']}")


def cmd_tts(flags, positional):
    text = positional[0] if positional else flags.get("text")
    if not text:
        print("Usage: el tts <text> --voice <id> [--model <id>] [--out <path>]", file=sys.stderr)
        sys.exit(1)

    voice_id = flags.get("voice")
    if not voice_id:
        print("Error: --voice <voice_id> is required", file=sys.stderr)
        sys.exit(1)

    model = flags.get("model", "eleven_multilingual_v2")
    fmt = flags.get("format", "mp3_44100_128")
    out_path = flags.get("out", "output.mp3")

    body = {"text": text, "model_id": model}

    has_settings = any(k in flags for k in ("stability", "similarity", "style", "speed"))
    if has_settings:
        body["voice_settings"] = {
            "stability": float(flags.get("stability", "0.5")),
            "similarity_boost": float(flags.get("similarity", "0.75")),
            "style": float(flags.get("style", "0")),
            "use_speaker_boost": flags.get("speaker-boost") != "false",
        }
        if "speed" in flags:
            body["voice_settings"]["speed"] = float(flags["speed"])

    if "seed" in flags:
        body["seed"] = int(flags["seed"])
    if "language" in flags:
        body["language_code"] = flags["language"]

    res = api_post_json(f"/v1/text-to-speech/{voice_id}?output_format={fmt}", body)
    write_audio(res, out_path)


def cmd_sfx(flags, positional):
    text = positional[0] if positional else flags.get("text")
    if not text:
        print("Usage: el sfx <description> [--duration <secs>] [--out <path>]", file=sys.stderr)
        sys.exit(1)

    out_path = flags.get("out", "sfx_output.mp3")
    body = {"text": text}

    if "duration" in flags:
        body["duration_seconds"] = float(flags["duration"])
    if "format" in flags:
        body["output_format"] = flags["format"]

    res = api_post_json("/v1/sound-generation", body)
    write_audio(res, out_path)


def cmd_music(flags, positional):
    prompt = positional[0] if positional else flags.get("prompt")
    if not prompt:
        print("Usage: el music <prompt> [--duration <secs>] [--instrumental] [--out <path>]", file=sys.stderr)
        sys.exit(1)

    out_path = flags.get("out", "music_output.mp3")
    body = {"prompt": prompt, "model_id": "music_v1"}

    if "duration" in flags:
        body["music_length_ms"] = round(float(flags["duration"]) * 1000)
    if "instrumental" in flags:
        body["force_instrumental"] = True
    if "seed" in flags:
        body["seed"] = int(flags["seed"])

    fmt = flags.get("format", "mp3_44100_128")
    print("Generating music (this may take a moment)...")
    res = api_post_json(f"/v1/music?output_format={fmt}", body)
    write_audio(res, out_path)


def cmd_isolate(flags, positional):
    input_path = positional[0] if positional else flags.get("input")
    if not input_path:
        print("Usage: el isolate <audio_file> [--out <path>]", file=sys.stderr)
        sys.exit(1)

    if not os.path.exists(input_path):
        print(f"Error: File not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    out_path = flags.get("out", "isolated_output.mp3")
    res = api_post_file("/v1/audio-isolation", input_path, field_name="audio")
    write_audio(res, out_path)


def cmd_stems(flags, positional):
    input_path = positional[0] if positional else flags.get("input")
    if not input_path:
        print("Usage: el stems <audio_file> [--variation two|six] [--out <path>]", file=sys.stderr)
        sys.exit(1)

    if not os.path.exists(input_path):
        print(f"Error: File not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    out_path = flags.get("out", "stems_output.zip")
    variation = "two_stems_v1" if flags.get("variation") == "two" else "six_stems_v1"
    fmt = flags.get("format", "mp3_44100_128")

    res = api_post_file(
        f"/v1/music/stem-separation?output_format={fmt}&stem_variation_id={variation}",
        input_path,
        field_name="file",
    )
    data = res.read()
    with open(out_path, "wb") as f:
        f.write(data)
    kb = len(data) / 1024
    label = variation.replace("_v1", "").replace("_", " ")
    print(f"✓ {out_path} ({kb:.1f} KB) — {label} stems")


def cmd_history(flags):
    params = {"page_size": flags.get("limit", "20")}
    if "voice" in flags:
        params["voice_id"] = flags["voice"]

    data = api_get("/v1/history", params)

    if "json" in flags:
        print(json.dumps(data, indent=2))
        return

    items = data.get("history", [])
    print(f"History ({len(items)} items):\n")
    for item in items:
        from datetime import datetime
        date = datetime.fromtimestamp(item.get("date_unix", 0)).strftime("%Y-%m-%d")
        chars = item.get("character_count_change_from", "?")
        print(f"  {item['history_item_id']}  {date}  {item.get('voice_name', 'unknown')}")
        print(f'    "{(item.get("text", ""))[:80]}" ({chars} chars)')
        print()


# ── Main ──────────────────────────────────────────────────────────────────────

HELP = """el — ElevenLabs CLI wrapper

Commands:
  models                          List available TTS models
  voices [--search q] [--category c] [--type t] [--limit n]
                                  Search/list voices
  voice <voice_id>                Get voice details
  tts <text> --voice <id> [--model <id>] [--out <path>] [--format <fmt>]
      [--stability n] [--similarity n] [--style n] [--speed n] [--seed n]
                                  Generate speech from text
  sfx <description> [--duration <secs>] [--out <path>]
                                  Generate sound effect from description
  music <prompt> [--duration <secs>] [--instrumental] [--out <path>]
                                  Generate music from text prompt
  isolate <audio_file> [--out <path>]
                                  Isolate vocals/speech from audio (remove background)
  stems <audio_file> [--variation two|six] [--out <path>]
                                  Separate audio into instrument stems (returns .zip)
  history [--voice <id>] [--limit n]
                                  View generation history

Global flags:
  --json                          Output raw JSON

Environment:
  ELEVENLABS_API_KEY              Required. Your ElevenLabs API key.
"""

COMMANDS = {
    "models": lambda f, p: cmd_models(f),
    "voices": lambda f, p: cmd_voices(f),
    "voice": cmd_voice_get,
    "tts": cmd_tts,
    "sfx": cmd_sfx,
    "music": cmd_music,
    "isolate": cmd_isolate,
    "stems": cmd_stems,
    "history": lambda f, p: cmd_history(f),
}


def main():
    args = sys.argv[1:]
    if not args or args[0] in ("help", "--help"):
        print(HELP)
        sys.exit(0)

    command = args[0]
    if command not in COMMANDS:
        print(f"Unknown command: {command}", file=sys.stderr)
        print("Run 'el help' for usage.", file=sys.stderr)
        sys.exit(1)

    flags, positional = parse_args(args[1:])
    COMMANDS[command](flags, positional)


if __name__ == "__main__":
    main()
