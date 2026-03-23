# gemini-image CLI Command Reference

Full command list for the `gemini-image` CLI. All commands support `--json` for raw JSON output.

## Image Generation

| Command | Description | Example |
|---------|-------------|---------|
| `create <prompt>` | Text → image | `gemini-image create "sunset over mountains" --output sunset.png` |
| `edit <instruction>` | Image + instruction → modified image | `gemini-image edit "make sky blue" --input photo.png --output fixed.png` |

Create flags: `--output <path>`, `--size <WxH>`, `--model <id>`
Edit flags: `--input <source>`, `--output <path>`, `--model <id>`

## Utility

| Command | Description | Example |
|---------|-------------|---------|
| `models` | List available models (local registry) | `gemini-image models` |
| `models --remote` | Query Gemini API for all available models | `gemini-image models --remote` |
| `help` | Show usage information | `gemini-image help` |

## Models

| Model ID | Name | Capabilities | Notes |
|----------|------|-------------|-------|
| `imagen-4.0-generate-001` | Imagen 4 | create | Best quality, requires billing. Default for create. |
| `gemini-2.0-flash-exp` | Gemini 2.0 Flash | create, edit | Free tier, rate-limited. Default for edit. |
| `gemini-2.5-flash-preview-image-generation` | Gemini 2.5 Flash Preview | create, edit | Preview. Free tier, rate-limited. |

## Supported Sizes

Sizes are specified as `WIDTHxHEIGHT` and mapped to the nearest supported aspect ratio:

| Aspect | Example Size | Use Case |
|--------|-------------|----------|
| 4:3 | `1280x960` | Landscape, cover art (default) |
| 3:4 | `960x1280` | Portrait |
| 1:1 | `1024x1024` | Square, icons |
| 16:9 | `1536x864` | Widescreen |
| 9:16 | `864x1536` | Mobile, stories |

## Global Flags

| Flag | Purpose |
|------|---------|
| `--json` | Raw JSON output (for scripting/parsing) |

## Environment

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | Required. Google AI Studio API key. Loaded from environment, `./.env`, or `~/.claude/.env`. |
