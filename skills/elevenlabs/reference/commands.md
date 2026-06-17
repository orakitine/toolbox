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
| `dialogue <inputs>` | Multi-voice → one audio | `el dialogue scene.json --out scene.mp3` |
| `sfx <desc>` | Text → sound effect | `el sfx "rain on roof" --duration 10 --out rain.mp3` |
| `music <prompt>` | Text → music | `el music "jazz intro" --duration 15 --out jazz.mp3` |

TTS flags: `--voice <id>`, `--model <id>`, `--stability <n>`, `--similarity <n>`, `--style <n>`, `--speed <n>`, `--seed <n>`
Dialogue flags: `--model <id>` (default `eleven_v3`), `--stability <n>`, `--out <path>`
Music flags: `--duration <secs>`, `--instrumental`, `--seed <n>`

### Expressive narration with `eleven_v3`

Add `--model eleven_v3` and embed inline **audio tags** (lowercase, square brackets):

```
el tts "[excited] We did it! [whispers] But don't tell anyone yet." --model eleven_v3 --stability 0.4 --out win.mp3
```

Full tag list, delivery rules, and length guidance: see `api-notes.md`.

### Multi-voice dialogue (`dialogue`)

One API call, multiple speakers, no ffmpeg stitching. `inputs` is a JSON array (file path or inline string) of `{text, voice_id}` turns, each able to carry its own tags (limits documented in `api-notes.md`).

```
el dialogue '[{"text":"[curious] Who is there?","voice_id":"ID1"},{"text":"[giggles] Me!","voice_id":"ID2"}]' --out scene.mp3
```

## Voice Design (create custom voices)

| Command | Description | Example |
|---------|-------------|---------|
| `voicedesign <desc>` | Design 3 voice previews from a prompt | `el voicedesign "squeaky young fox kit" --out-prefix ember` |
| `voicesave <gid>` | Persist a chosen preview → permanent `voice_id` | `el voicesave <gid> --name "Ember" --description "young fox kit"` |

Voicedesign flags: `--text <preview>` (else auto-generated), `--model <id>` (default `eleven_ttv_v3`), `--out-prefix <path>`, `--loudness <-1..1>`, `--guidance <n>`
Voicesave flags: `--name <name>` (required), `--description <desc>`

Flow: `voicedesign` → audition the saved `*-1/2/3.mp3` previews → `voicesave` the favourite's `generated_voice_id` → use the returned `voice_id` in `tts`/`dialogue`.

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
