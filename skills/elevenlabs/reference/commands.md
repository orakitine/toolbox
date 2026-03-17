# el CLI Command Reference

Full command list for the `el` CLI wrapper. All commands support `--json` for raw JSON output.

## Voice Discovery

| Command | Description | Example |
|---------|-------------|---------|
| `voices` | Search/list voices | `el voices --search "deep male" --limit 5` |
| `voice <id>` | Get voice details | `el voice Aa6nEBJJMKJwJkCx8VU2` |

Flags: `--search <query>`, `--category <premade|cloned|generated|professional>`, `--type <type>`, `--limit <n>`

## Audio Generation

| Command | Description | Example |
|---------|-------------|---------|
| `tts <text>` | Text → speech | `el tts "Hello" --voice <id> --out hi.mp3` |
| `sfx <desc>` | Text → sound effect | `el sfx "rain on roof" --duration 10 --out rain.mp3` |
| `music <prompt>` | Text → music | `el music "jazz intro" --duration 15 --out jazz.mp3` |

TTS flags: `--voice <id>`, `--model <id>`, `--stability <n>`, `--similarity <n>`, `--style <n>`, `--speed <n>`, `--seed <n>`
Music flags: `--duration <secs>`, `--instrumental`, `--seed <n>`

## Audio Processing

| Command | Description | Example |
|---------|-------------|---------|
| `isolate <file>` | Remove background noise | `el isolate noisy.mp3 --out clean.mp3` |
| `stems <file>` | Separate instruments | `el stems song.mp3 --variation six --out stems.zip` |

Stems variations: `two` (vocals + accompaniment), `six` (vocals, drums, bass, guitar, piano, other)

## Utility

| Command | Description | Example |
|---------|-------------|---------|
| `models` | List TTS models | `el models` |
| `history` | View past generations | `el history --limit 10 --voice <id>` |

## Global Flags

| Flag | Purpose |
|------|---------|
| `--json` | Raw JSON output (for scripting/parsing) |
| `--out <path>` | Output file path |
| `--format <fmt>` | Audio format: mp3_44100_128, wav_44100, pcm_44100, opus_48000_128 |
