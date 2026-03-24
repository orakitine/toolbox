# speak

Provider-agnostic text-to-speech output. Text in, audio out, played immediately.

## Quick Start

```
/speak "Hello from the future"
```

Or use from any agent/skill workflow — just invoke speak with the text to vocalize.

## Options

| Variable | Default | Description |
|---|---|---|
| `PROVIDER_ORDER` | `elevenlabs,say` | TTS provider fallback chain |
| `DEFAULT_VOICE` | `pNInz6obpgDQGcFmaJgB` | ElevenLabs voice (Adam) |
| `DEFAULT_MODEL` | `eleven_multilingual_v2` | ElevenLabs model |
| `DEFAULT_SPEED` | `1.15` | ElevenLabs speech speed multiplier |
| `PLAYBACK_CMD` | `afplay` | Audio playback command (macOS) |
| `AUTO_CLEANUP` | `true` | Delete temp audio files after playback |

## Prerequisites

- At least one TTS provider:
  - **elevenlabs** skill with `ELEVENLABS_API_KEY` configured (high quality)
  - **macOS** with `say` command (always available on Mac, basic quality)

## Examples

```
/speak "Build completed with 0 errors"
/speak "The API returned 3 critical vulnerabilities in the auth module"
```

From an agent workflow: research a topic, summarize findings, speak the summary.

## Related

- `elevenlabs` — full audio production skill (TTS, SFX, music, stems)
- `elevenlabs-operator` — agent for audio generation tasks
