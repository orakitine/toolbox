---
name: elevenlabs
description: Text-to-speech, sound effects, music generation, and audio processing using the ElevenLabs API via the el CLI. Use for voice generation, audio content creation, sound design, or audio processing.
argument-hint: "[tts|sfx|music|voices] [text or options]"
allowed-tools:
  - Bash
  - Read
---

# Purpose

Generate speech, sound effects, and music using the ElevenLabs API via the `el` CLI bundled with this skill. Also supports audio isolation and stem separation.

## Prerequisites

- `python3` must be available in PATH (no pip packages needed — stdlib only)
- `ELEVENLABS_API_KEY` must be set. Add to one of:
  - Project `.env` (for project-level installs): `echo 'ELEVENLABS_API_KEY=your-key' >> .env`
  - Global `~/.claude/.env` (for global installs): `echo 'ELEVENLABS_API_KEY=your-key' >> ~/.claude/.env`
  - Or export directly: `export ELEVENLABS_API_KEY=your-key`

## Variables

EL_CLI: python3 ${CLAUDE_SKILL_DIR}/scripts/el.py     # Path to the el CLI wrapper
DEFAULT_VOICE: Aa6nEBJJMKJwJkCx8VU2                  # Quentin — calm, male, narrator. Override with --voice
DEFAULT_MODEL: eleven_multilingual_v2                 # Options: eleven_v3, eleven_multilingual_v2, eleven_flash_v2_5
OUTPUT_DIR: ./audio                                   # Where generated audio files are saved
OUTPUT_FORMAT: mp3_44100_128                          # Options: mp3_44100_128, wav_44100, pcm_44100, opus_48000_128

## Workflow

1. **Check Prerequisites**
   - IF: `which python3` fails → report "python3 not found" and stop
   - IF: `${CLAUDE_SKILL_DIR}/scripts/el.py` not found → report "el CLI missing" and stop
   - IF: API key not available → run `<EL_CLI> models` as a lightweight auth check. If it fails with "ELEVENLABS_API_KEY not set", stop and tell the user:
     > ELEVENLABS_API_KEY is not configured. Set it in one of:
     > - **Project-level:** add `ELEVENLABS_API_KEY=your-key` to `./.env`
     > - **Global (recommended for personal use):** add `ELEVENLABS_API_KEY=your-key` to `~/.claude/.env`
     > - **Shell:** `export ELEVENLABS_API_KEY=your-key`
     >
     > Get your API key at: https://elevenlabs.io/app/settings/api-keys
   - Example: python3 found, el.py exists, API key valid → proceed
   - Tool: Bash

2. **Discover Voices**
   - Search the ElevenLabs voice library for the right voice
   - Example: "find a calm female narrator" → `<EL_CLI> voices --search "calm female narrator" --limit 5`
   - Example: "list my cloned voices" → `<EL_CLI> voices --category cloned --limit 10`
   - Get details: `<EL_CLI> voice <voice_id>`
   - Tool: Bash `<EL_CLI> voices [--search <query>] [--category <cat>] [--limit <n>]`

3. **Generate Speech (TTS)**
   - Convert text to audio using a voice and model
   - IF: no `--voice` → use DEFAULT_VOICE
   - IF: no `--model` → use DEFAULT_MODEL
   - IF: default voice returns 404 or error → search for a replacement: `<EL_CLI> voices --search "calm male narrator" --limit 3`
   - IF: fine-tuning → add `--stability`, `--similarity`, `--style`, `--speed`
   - Example: `<EL_CLI> tts "Welcome to the show." --voice Aa6nEBJJMKJwJkCx8VU2 --out welcome.mp3`
   - Example with v3: `<EL_CLI> tts "Hello world" --model eleven_v3 --out hello.mp3`
   - Tool: Bash `<EL_CLI> tts <text> --voice <id> [--model <id>] [--out <path>] [--stability n] [--similarity n] [--style n] [--speed n]`

4. **Generate Sound Effects**
   - Create sound effects from a text description (0.5–30 seconds)
   - Example: `<EL_CLI> sfx "thunder rolling across mountains" --duration 5 --out thunder.mp3`
   - Tool: Bash `<EL_CLI> sfx <description> [--duration <secs>] [--out <path>]`

5. **Generate Music**
   - Create music from a text prompt (3 seconds to 5 minutes)
   - IF: no vocals wanted → add `--instrumental`
   - NOTE: Music generation can take 30–60+ seconds
   - Example: `<EL_CLI> music "upbeat jazz intro for a podcast" --duration 15 --out intro.mp3`
   - Example: `<EL_CLI> music "ambient lo-fi beat" --duration 60 --instrumental --out lofi.mp3`
   - Tool: Bash `<EL_CLI> music <prompt> [--duration <secs>] [--instrumental] [--out <path>]`

6. **Process Audio**
   - Isolate vocals: `<EL_CLI> isolate noisy-recording.mp3 --out clean-voice.mp3`
   - Separate stems: `<EL_CLI> stems song.mp3 --variation six --out stems.zip`
   - Variations: `two` (vocals + accompaniment) or `six` (vocals, drums, bass, guitar, piano, other)
   - NOTE: Stems processing is high latency
   - Example: `<EL_CLI> isolate interview.mp3 --out clean.mp3`
   - Tool: Bash

7. **Check History & Models**
   - List past generations: `<EL_CLI> history --limit 10`
   - List available TTS models: `<EL_CLI> models`
   - Add `--json` to any command for raw JSON output
   - Example: `<EL_CLI> history --voice Aa6nEBJJMKJwJkCx8VU2 --limit 5`
   - Tool: Bash
