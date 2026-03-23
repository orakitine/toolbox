# gen-image

Generate or edit images using AI image models via the Gemini API.

## Quick Start

```
/gen-image create "a watercolor painting of a mountain lake at sunset" --output lake.png
```

## Options

| Variable | Default | Description |
|---|---|---|
| GI_CLI | python3 ${CLAUDE_SKILL_DIR}/gemini-image.py | Path to the Gemini image CLI |
| DEFAULT_CREATE_MODEL | imagen-4.0-generate-001 | Imagen 4 — best quality |
| DEFAULT_EDIT_MODEL | gemini-2.0-flash-exp | Gemini 2.0 Flash — supports editing |
| DEFAULT_SIZE | 1280x960 | 4:3 landscape |

## Prerequisites

- `python3` must be available in PATH (no pip packages needed — stdlib only)
- `GEMINI_API_KEY` — add to one of:
  - Project: `echo 'GEMINI_API_KEY=your-key' >> .env`
  - Global: `echo 'GEMINI_API_KEY=your-key' >> ~/.claude/.env`

Get your API key at: https://aistudio.google.com/apikey

**Note:** This skill makes API calls that consume Google AI credits. Imagen 4 requires billing. Gemini Flash has a free tier but is rate-limited. See [Google AI pricing](https://ai.google.dev/pricing) for details.

## Examples

- `"generate a landscape painting of mountains"` — creates image with Imagen 4
- `"create a pixel art character, square"` — creates with --size 1024x1024
- `"make the sky orange in this photo"` — edits existing image
- `"remove the text from this screenshot"` — edits to clean up
- `"what models are available?"` — lists models and capabilities

## Adding Providers

The skill is provider-agnostic. Each provider is a separate CLI script in the skill directory following a shared contract (subcommands, flags, output format). See `gemini-image.py` as the reference implementation.
