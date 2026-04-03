---
name: speak
description: >-
  Provider-agnostic text-to-speech output with audio caching. Converts text to
  audio and plays it immediately. Caches generated audio to avoid redundant API
  calls on repeated phrases. Falls back through available TTS providers
  (elevenlabs, macOS say). Use as a composable voice output primitive from any
  skill, agent, or workflow.
  TRIGGER when: user says "say out loud", "say aloud", "announce", "read out",
  "tell me out loud", or any phrasing that implies audible/voice output rather
  than text. Also trigger when user says "say X" at the end of a task request
  (e.g., "do X and when done say Done") — this means spoken output, not typed.
  DO NOT TRIGGER when: "say" is used figuratively ("let's say we have...") or
  means "write/type" in context.
argument-hint: "[text to speak]"
allowed-tools:
  - Bash
  - Read
  - Glob
---

# Purpose

Convert text to audible speech and play it immediately. Provider-agnostic facade that tries the best available TTS provider and falls back gracefully. Caches generated audio so repeated phrases (like "done", "build failed") play instantly from disk instead of making redundant API calls. Designed to be composed into other skills and agent workflows as a voice output primitive.

## Variables

PROVIDER_ORDER: elevenlabs,say               # Comma-separated provider chain, tried in order
DEFAULT_VOICE: pNInz6obpgDQGcFmaJgB          # ElevenLabs voice ID (Adam — dominant, firm)
DEFAULT_MODEL: eleven_multilingual_v2         # ElevenLabs model
DEFAULT_SPEED: 1.15                            # ElevenLabs speech speed multiplier
PLAYBACK_CMD: afplay                          # macOS audio playback command
AUTO_CLEANUP: true                            # Delete temp audio files after playback
CACHE_ENABLED: true                           # Enable TTS audio caching
CACHE_TOOL: python3 ./scripts/speak-cache.py  # Cache management CLI
MAX_CACHE_SIZE_MB: 100                        # Max cache size in MB before LRU eviction

## Workflow

1. **Resolve Text**
   - IF: `$ARGUMENTS` is provided → use as text to speak
   - IF: no arguments → use the most recent substantive output from the conversation (summary, research result, etc.)
   - IF: text is very long (>5000 chars) → warn that this may take a moment and cost API credits
   - Example: `/speak "The deployment completed successfully"` → text is "The deployment completed successfully"
   - Example: after a research summary → speak the summary

2. **Detect Available Providers**
   - Walk PROVIDER_ORDER and check availability of each:
   - **elevenlabs**: find the elevenlabs skill directory by running `find ~/.claude/skills -name SKILL.md -path '*/elevenlabs/*' 2>/dev/null | head -1 | xargs dirname` (also check `.agents/skills/`). Then verify the API key by running `python3 <elevenlabs-dir>/scripts/el.py models` — if it returns successfully, provider is available.
   - **say**: check if `say` command exists (`which say`)
   - IF: no providers available → report error: "No TTS providers available. Install the elevenlabs skill or use macOS."
   - Example: `find ~/.claude/skills -name SKILL.md -path '*/elevenlabs/*'` returns a path → run `python3 <that-dir>/scripts/el.py models` → success → elevenlabs available. API key missing → fall through to `which say` → found → use say.
   - Tool: Bash

3. **Check Cache**
   - IF: CACHE_ENABLED is false → skip to step 4
   - IF: selected provider is say (free, no API cost) → skip to step 4
   - Run: `<CACHE_TOOL> find "<text>" --voice <DEFAULT_VOICE> --model <DEFAULT_MODEL> --speed <DEFAULT_SPEED>`
   - IF output starts with `HIT`: extract the audio file path from the output
   - Play cached audio: `<PLAYBACK_CMD> <audio_path>`
   - Record the hit: `<CACHE_TOOL> bump "<text>" --voice <DEFAULT_VOICE> --model <DEFAULT_MODEL> --speed <DEFAULT_SPEED>`
   - Do NOT delete the cached file — it is managed by the cache
   - Skip to step 6 (Report), noting playback was from cache
   - IF output is `MISS`: continue to step 4
   - Example: `python3 ./scripts/speak-cache.py find "build complete" --voice pNInz6obpgDQGcFmaJgB` → `HIT /Users/me/.claude/speak-cache/audio/a1b2c3.mp3` → play it, bump, done. Or → `MISS` → continue to Generate Audio.
   - Tool: Bash

4. **Generate Audio**
   - First, create a unique temp file: `TMPFILE=$(mktemp /tmp/speak_XXXXXX.mp3)`
   - **elevenlabs**: `python3 <elevenlabs-dir>/scripts/el.py tts "<text>" --voice <DEFAULT_VOICE> --model <DEFAULT_MODEL> --speed <DEFAULT_SPEED> --out $TMPFILE`
   - IF: TTS command fails (voice 404, quota exceeded, etc.) → `rm -f $TMPFILE`, fall through to next provider in chain
   - **say** (macOS fallback): `say "<text>"`
   - IF: text contains special characters → write to temp file and use `say -f /tmp/speak_input.txt`
   - IF: provider is say → play is immediate, skip to step 6 (Report)
   - Example: `TMPFILE=$(mktemp /tmp/speak_XXXXXX.mp3) && python3 <elevenlabs-dir>/scripts/el.py tts "hello world" --voice pNInz6obpgDQGcFmaJgB --out $TMPFILE` → file created → continue to Cache and Play. If fails → `rm -f $TMPFILE` → try `say "hello world"`.
   - Tool: Bash

5. **Cache and Play**
   - This step runs for any paid provider that produced an audio file
   - IF: CACHE_ENABLED is true → store in cache:
     `<CACHE_TOOL> store "<text>" --voice <DEFAULT_VOICE> --model <DEFAULT_MODEL> --speed <DEFAULT_SPEED> --file $TMPFILE`
   - Play audio: `<PLAYBACK_CMD> $TMPFILE`
   - IF: AUTO_CLEANUP is true → `rm $TMPFILE` (cache has its own copy)
   - Example: `python3 ./scripts/speak-cache.py store "done" --file $TMPFILE --voice pNInz6obpgDQGcFmaJgB --speed 1.15` → `STORED a1b2c3` → then `afplay $TMPFILE && rm $TMPFILE`
   - Tool: Bash

6. **Report**
   - Briefly confirm what was spoken and which provider was used
   - IF: served from cache → "Spoke via cache (X hits)" — keep it short
   - IF: generated and cached → "Spoke via elevenlabs — cached for reuse"
   - IF: fell back from a higher-priority provider → mention the fallback and why
   - Keep report minimal — one line, not a paragraph
   - Example: "Spoke via cache (14 hits)"
   - Example: "Spoke via elevenlabs — cached for reuse"
   - Example: "Spoke via macOS say (elevenlabs unavailable — no API key)"
