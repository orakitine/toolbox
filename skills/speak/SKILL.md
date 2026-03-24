---
name: speak
description: >-
  Provider-agnostic text-to-speech output. Converts text to audio and plays it
  immediately. Falls back through available TTS providers (elevenlabs, macOS say).
  Use as a composable voice output primitive from any skill, agent, or workflow.
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

Convert text to audible speech and play it immediately. Provider-agnostic facade that tries the best available TTS provider and falls back gracefully. Designed to be composed into other skills and agent workflows as a voice output primitive.

## Variables

PROVIDER_ORDER: elevenlabs,say               # Comma-separated provider chain, tried in order
DEFAULT_VOICE: pNInz6obpgDQGcFmaJgB          # ElevenLabs voice ID (Adam — dominant, firm)
DEFAULT_MODEL: eleven_multilingual_v2         # ElevenLabs model
DEFAULT_SPEED: 1.15                            # ElevenLabs speech speed multiplier
PLAYBACK_CMD: afplay                          # macOS audio playback command
AUTO_CLEANUP: true                            # Delete temp audio files after playback

## Workflow

1. **Resolve Text**
   - IF: `$ARGUMENTS` is provided → use as text to speak
   - IF: no arguments → use the most recent substantive output from the conversation (summary, research result, etc.)
   - IF: text is very long (>5000 chars) → warn that this may take a moment and cost API credits
   - Example: `/speak "The deployment completed successfully"` → text is "The deployment completed successfully"
   - Example: after a research summary → speak the summary

2. **Detect Available Providers**
   - Walk PROVIDER_ORDER and check availability of each:
   - **elevenlabs**: check if elevenlabs skill is installed by looking for SKILL.md, then check if API key is configured by running `python3 <elevenlabs-skill-dir>/scripts/el.py models` — if it returns successfully, provider is available
   - **say**: check if `say` command exists (`which say`)
   - IF: no providers available → report error: "No TTS providers available. Install the elevenlabs skill or use macOS."
   - Example: elevenlabs key configured → use elevenlabs. Key missing, macOS → use say. Neither → error.
   - Tool: Bash

3. **Generate and Play — elevenlabs**
   - IF: selected provider is elevenlabs
   - Generate audio: `python3 <elevenlabs-skill-dir>/scripts/el.py tts "<text>" --voice <DEFAULT_VOICE> --model <DEFAULT_MODEL> --speed <DEFAULT_SPEED> --out /tmp/speak_output.mp3`
   - IF: TTS command fails (voice 404, quota exceeded, etc.) → fall through to next provider in chain
   - Play audio: `<PLAYBACK_CMD> /tmp/speak_output.mp3`
   - IF: AUTO_CLEANUP is true → `rm /tmp/speak_output.mp3`
   - Example: `python3 ~/.claude/skills/elevenlabs/scripts/el.py tts "Hello world" --voice pNInz6obpgDQGcFmaJgB --speed 1.15 --out /tmp/speak_output.mp3 && afplay /tmp/speak_output.mp3 && rm /tmp/speak_output.mp3`
   - Tool: Bash

4. **Generate and Play — say (macOS fallback)**
   - IF: selected provider is say
   - Play directly: `say "<text>"`
   - IF: text contains special characters → write to temp file and use `say -f /tmp/speak_input.txt`
   - Example: `say "The deployment completed successfully"`
   - Example (long text): write text to `/tmp/speak_input.txt` → `say -f /tmp/speak_input.txt && rm /tmp/speak_input.txt`
   - Tool: Bash

5. **Report**
   - Briefly confirm what was spoken and which provider was used
   - IF: fell back from a higher-priority provider → mention the fallback and why
   - Keep report minimal — one line, not a paragraph
   - Example: "Spoke via elevenlabs (Quentin voice, 12 seconds)"
   - Example: "Spoke via macOS say (elevenlabs unavailable — no API key)"
