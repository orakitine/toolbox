# elevenlabs

Text-to-speech, sound effects, music generation, and audio processing using the ElevenLabs API.

## Quick Start

```
/elevenlabs tts "Hello world" --out hello.mp3
```

## Options

| Variable | Default | Description |
|---|---|---|
| EL_CLI | python3 ${CLAUDE_SKILL_DIR}/scripts/el.py | Path to the el CLI wrapper |
| DEFAULT_VOICE | Aa6nEBJJMKJwJkCx8VU2 | Quentin — calm, male, narrator |
| DEFAULT_MODEL | eleven_multilingual_v2 | TTS model |
| OUTPUT_DIR | ./audio | Where generated files are saved |
| OUTPUT_FORMAT | mp3_44100_128 | Audio format |

## Prerequisites

- `python3` must be available in PATH (no pip packages needed — stdlib only)
- `ELEVENLABS_API_KEY` — add to one of:
  - Project: `echo 'ELEVENLABS_API_KEY=your-key' >> .env`
  - Global: `echo 'ELEVENLABS_API_KEY=your-key' >> ~/.claude/.env`

**Note:** This skill makes API calls that consume ElevenLabs credits. Voice search and model listing are free, but TTS, sound effects, music generation, and audio processing are billed. See [ElevenLabs pricing](https://elevenlabs.io/pricing) for details.

## Examples

- `"generate a calm welcome message"` — TTS with default voice
- `"find a deep male voice for a documentary narrator"` — voice search
- `"create thunder sound effect, 5 seconds"` — SFX generation
- `"make a 30-second lo-fi beat for a video"` — music generation
- `"clean up this noisy recording"` — audio isolation

## Related

Part of the **elevenlabs** family:

| Asset | Type | Relationship |
|---|---|---|
| elevenlabs-operator | agent (orange) | Depends on this — general audio generation, parallel-safe |
| elevenlabs-voice-designer | agent (cyan) | Depends on this — voice casting with audition samples |
