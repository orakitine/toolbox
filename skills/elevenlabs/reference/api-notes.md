# ElevenLabs Capability Log

A dated record of which ElevenLabs models/endpoints the `el` CLI uses, with request shapes and limits.
Append a new dated entry when the API gains features or our wrappers change — don't rewrite history.

---

## 2026-06-16 — v3 expressivity, dialogue, and voice design

Verified live against the account API and added CLI wrappers for the three new capabilities below.

### Models (from `el models`, 2026-06-16)

| model_id | Use | Notes |
|----------|-----|-------|
| `eleven_v3` | Most expressive TTS + dialogue | Supports inline `[audio tags]`. 74 languages, cost 1.0x. |
| `eleven_multilingual_v2` | Steady audiobook narration | Current `tts` default. 29 languages, cost 1.0x. |
| `eleven_flash_v2_5` | Low-latency / conversational | cost 0.5x. |
| `eleven_ttv_v3` | Voice Design (text → voice) | Powers `voicedesign`. Older default is `eleven_multilingual_ttv_v2`. |

### 1. Expressive TTS — `eleven_v3` audio tags

- Tags are **lowercase in square brackets, inline** in the text: `[whispers]`, `[excited]`, `[gasps]`, `[laughs]`, `[curious]`, `[sighs]`, `[nervously]`, `[sarcastic]`.
- Native (no tag needed): **CAPS** = emphasis/volume, `...` = pause, `—` = breathless break.
- **Rule:** the chosen voice must already be close to the target delivery — a calm voice fakes a whisper but won't truly shout.
- **Length:** v3 is inconsistent on very short prompts; aim for ≥250 chars per request. Single-request TTS handles a paragraph/scene comfortably; chunk longer.
- Native IPA pronunciation control across 70+ languages (no XML tags).
- CLI: `el tts "<text with [tags]>" --voice <id> --model eleven_v3 --stability 0.4`
- The CLI passes `text` straight through, so tags are never escaped/stripped.

### 2. Text to Dialogue — multi-voice in one call

- Endpoint: `POST /v1/text-to-dialogue?output_format=<fmt>` — defaults to `eleven_v3`.
- Body: `{ "inputs": [ {"text": "...", "voice_id": "..."}, ... ], "model_id": "eleven_v3", "settings": {"stability": 0.5} }`
- **Limits:** max **10 unique voice_ids**; **≤2000 characters** total across all `inputs[].text` (the CLI warns past this). Chunk longer scenes and concatenate the resulting mp3s.
- Each turn carries its own `[audio tags]`. Replaces per-line `tts` + ffmpeg stitching.
- CLI: `el dialogue <inputs.json|json-string> [--model <id>] [--stability n] [--out <path>]`
- Verified 2026-06-16: 2-turn call (Luna + Patches voices, with `[curious]`/`[giggles]`) returned a single 127 KB mp3.

### 3. Voice Design v3 — create a custom voice from a prompt

Solves "the library has no kids' voices" — you describe a voice and the model generates it.

- **Design:** `POST /v1/text-to-voice/design`
  - Body: `{ "voice_description": "...", "model_id": "eleven_ttv_v3", "text"?: "<100-1000 char preview>", "auto_generate_text"?: true, "loudness"?: -1..1, "guidance_scale"?: 5 }`
  - Returns `previews: [{ generated_voice_id, audio_base_64, media_type, duration_secs, language }]` (3 takes) + `text`.
  - CLI saves each preview to `<out-prefix>-N.mp3` and prints `generated_voice_id`s.
- **Save:** `POST /v1/text-to-voice`
  - Body: `{ "voice_name": "...", "voice_description": "...", "generated_voice_id": "..." }`
  - Returns the permanent `voice_id` for use in `tts`/`dialogue`.
- CLI: `el voicedesign "<description>" [--out-prefix <path>]` then `el voicesave <generated_voice_id> --name <name> --description <desc>`
- Describe **age, accent, tone, pacing** in one sentence for best results.

### Sources (fetched 2026-06-16)

- Eleven v3 — https://elevenlabs.io/v3
- v3 prompting / audio tags — https://elevenlabs.io/docs/best-practices/prompting/eleven-v3
- Text to Dialogue — https://elevenlabs.io/docs/overview/capabilities/text-to-dialogue · API: https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert
- Voice Design v3 — https://elevenlabs.io/blog/voice-design-v3 · Design API: https://elevenlabs.io/docs/api-reference/text-to-voice/design · Create API: https://elevenlabs.io/docs/api-reference/text-to-voice/create
