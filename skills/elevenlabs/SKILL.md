---
name: elevenlabs
description: Text-to-speech, multi-voice dialogue, custom voice design, sound effects, music generation, and audio processing using the ElevenLabs API via the el CLI. Use for voice generation, character voices, designing new voices (e.g. children/creatures), expressive narration with audio tags, audio content creation, or sound design.
argument-hint: "[tts|sfx|music|voices] [text or options]"
allowed-tools:
  - Bash
  - Read
---

## Variables

EL_CLI: python3 ./scripts/el.py                       # Path to the el CLI wrapper
DEFAULT_VOICE: Aa6nEBJJMKJwJkCx8VU2                  # Quentin — calm, male, narrator. Override with --voice
DEFAULT_MODEL: eleven_multilingual_v2                 # Steady audiobook default. Use eleven_v3 for expressive (audio tags), eleven_flash_v2_5 for low-latency
EXPRESSIVE_MODEL: eleven_v3                           # Most expressive: supports inline [audio tags], multi-voice dialogue
VOICE_DESIGN_MODEL: eleven_ttv_v3                     # Text-to-Voice: design custom voices from a prompt (e.g. a child's voice)
OUTPUT_DIR: ./audio                                   # Where generated audio files are saved
OUTPUT_FORMAT: mp3_44100_128                          # Options: mp3_44100_128, wav_44100, pcm_44100, opus_48000_128

## References

### Command syntax & flags

- IF: need full flag details or exact syntax for any command
- THEN: Read `reference/commands.md`
- EXAMPLES: "what flags does dialogue take", "how do I pass stems variation"

### v3 audio tags, dialogue & voice design

- IF: working with eleven_v3 expressivity, multi-voice dialogue, or designing voices (the rot-prone model IDs, tag list, and limits live here, dated)
- THEN: Read `reference/api-notes.md`
- EXAMPLES: "make two characters talk in one clip", "design a child's voice", "which audio tags exist"

## Workflow

1. **Check Prerequisites**
   - IF: `which python3` fails → report "python3 not found" and stop (no pip packages needed — stdlib only)
   - IF: the `el.py` script from EL_CLI path not found → report "el CLI missing" and stop
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
   - IF: expressive delivery wanted (storytelling, character voices) → use `--model eleven_v3` with inline `[audio tags]`:
     - Tags are lowercase in square brackets, inline: `[whispers]`, `[excited]`, `[gasps]`, `[laughs]`, `[curious]`, `[sighs]`
     - CAPS = emphasis/volume; `...` = pause; `—` = breathless break (the model reads these natively)
     - RULE: pick a voice already close to the target delivery — a calm voice fakes a whisper but won't truly shout
     - Chunk by paragraph/scene; v3 is inconsistent on very short prompts (<250 chars)
   - Example: `<EL_CLI> tts "Welcome to the show." --voice Aa6nEBJJMKJwJkCx8VU2 --out welcome.mp3`
   - Example with v3: `<EL_CLI> tts "[excited] You made it! [whispers] I wasn't sure you would." --model eleven_v3 --stability 0.4 --out hello.mp3`
   - Tool: Bash `<EL_CLI> tts <text> --voice <id> [--model <id>] [--out <path>] [--stability n] [--similarity n] [--style n] [--speed n]`

4. **Multi-Voice Dialogue (one call, no stitching)**
   - For multiple speakers in a single scene, use `dialogue` instead of stitching separate `tts` calls
   - Input is a JSON array of `{text, voice_id}` turns; each turn can carry its own `[audio tags]`
   - LIMITS: max 10 unique voices, ≤2000 characters total across all turns (chunk longer scenes)
   - Uses `eleven_v3` by default
   - Example: `<EL_CLI> dialogue '[{"text":"[curious] Who is there?","voice_id":"ID1"},{"text":"[giggles] It is me!","voice_id":"ID2"}]' --out scene.mp3`
   - Example with a file: `<EL_CLI> dialogue scene.json --stability 0.4 --out scene.mp3`
   - Tool: Bash `<EL_CLI> dialogue <inputs.json|json-string> [--model <id>] [--stability n] [--out <path>]`

5. **Design Custom Voices (Voice Design v3)**
   - When the library lacks a fitting voice (e.g. a child, a creature), design one from a text description
   - Step 1 — design: returns 3 previews (saved as audio) each with a `generated_voice_id`
   - Step 2 — audition the previews, then persist the favourite with `voicesave` to get a permanent `voice_id`
   - Describe age, accent, tone, pacing in one sentence; uses `eleven_ttv_v3`
   - Example: `<EL_CLI> voicedesign "an excitable 4-year-old fox kit, bright and squeaky, breathless with enthusiasm" --out-prefix audio/ember`
   - Then: `<EL_CLI> voicesave <generated_voice_id> --name "Ember" --description "excitable young fox kit"`
   - Tool: Bash `<EL_CLI> voicedesign <description> [--text <preview>] [--out-prefix <path>]` then `<EL_CLI> voicesave <gid> --name <name> --description <desc>`

6. **Generate Sound Effects**
   - Create sound effects from a text description (0.5–30 seconds)
   - Example: `<EL_CLI> sfx "thunder rolling across mountains" --duration 5 --out thunder.mp3`
   - Tool: Bash `<EL_CLI> sfx <description> [--duration <secs>] [--out <path>]`

7. **Generate Music**
   - Create music from a text prompt (3 seconds to 5 minutes)
   - IF: no vocals wanted → add `--instrumental`
   - NOTE: Music generation can take 30–60+ seconds
   - Example: `<EL_CLI> music "upbeat jazz intro for a podcast" --duration 15 --out intro.mp3`
   - Example: `<EL_CLI> music "ambient lo-fi beat" --duration 60 --instrumental --out lofi.mp3`
   - Tool: Bash `<EL_CLI> music <prompt> [--duration <secs>] [--instrumental] [--out <path>]`

8. **Process Audio**
   - Isolate vocals: `<EL_CLI> isolate noisy-recording.mp3 --out clean-voice.mp3`
   - Separate stems: `<EL_CLI> stems song.mp3 --variation six --out stems.zip`
   - Variations: `two` (vocals + accompaniment) or `six` (vocals, drums, bass, guitar, piano, other)
   - NOTE: Stems processing is high latency
   - Example: `<EL_CLI> isolate interview.mp3 --out clean.mp3`
   - Tool: Bash

9. **Check History & Models**
   - List past generations: `<EL_CLI> history --limit 10`
   - List available TTS models: `<EL_CLI> models`
   - Add `--json` to any command for raw JSON output
   - Example: `<EL_CLI> history --voice Aa6nEBJJMKJwJkCx8VU2 --limit 5`
   - Tool: Bash

## Works well with

Optional collaborators — `elevenlabs` runs standalone and these degrade gracefully if absent.

- **`speak`** — the provider-agnostic TTS primitive that falls back *through* `elevenlabs` first (then macOS say); use `speak` when you just need audio out, `elevenlabs` directly for voice design, dialogue, SFX, and music.
- **`elevenlabs-operator` / `elevenlabs-voice-designer`** (agents) — drive this skill for parallel generation and voice casting.
