---
name: gen-image
description: Generate or edit images using AI image models. Currently supports Google Gemini (Imagen 4 for creation, Gemini Flash for editing). Provider-agnostic design. Use for image generation, visual content creation, or image editing tasks.
argument-hint: "[create|edit] [prompt or options]"
allowed-tools:
  - Bash
  - Read
---

# Purpose

Generate or edit images via AI image models. Generic — no style or domain knowledge. Higher-order skills build prompts and call the CLI scripts bundled here.

## Prerequisites

- `python3` must be available in PATH (no pip packages needed — stdlib only)
- `GEMINI_API_KEY` must be set. Add to one of:
  - Project `.env` (for project-level installs): `echo 'GEMINI_API_KEY=your-key' >> .env`
  - Global `~/.claude/.env` (for global installs): `echo 'GEMINI_API_KEY=your-key' >> ~/.claude/.env`
  - Or export directly: `export GEMINI_API_KEY=your-key`

**Note:** This skill makes API calls that consume Google AI credits. Imagen 4 requires billing. Gemini Flash has a free tier but is rate-limited. See [Google AI pricing](https://ai.google.dev/pricing) for details.

## Variables

GI_CLI: python3 ${CLAUDE_SKILL_DIR}/gemini-image.py   # Path to the Gemini image CLI
DEFAULT_CREATE_MODEL: imagen-4.0-generate-001          # Imagen 4. Best quality. Override with --model
DEFAULT_EDIT_MODEL: gemini-2.0-flash-exp               # Gemini 2.0 Flash. Only option for edits currently
DEFAULT_SIZE: 1280x960                                 # 4:3 landscape. Override with --size

## Workflow

1. **Check Prerequisites**
   - IF: `which python3` fails → report "python3 not found" and stop
   - IF: `${CLAUDE_SKILL_DIR}/gemini-image.py` not found → report "gemini-image CLI missing" and stop
   - IF: API key not available → run `<GI_CLI> models` as a lightweight auth check. If it fails with "GEMINI_API_KEY not set", stop and tell the user:
     > GEMINI_API_KEY is not configured. Set it in one of:
     > - **Project-level:** add `GEMINI_API_KEY=your-key` to `./.env`
     > - **Global (recommended for personal use):** add `GEMINI_API_KEY=your-key` to `~/.claude/.env`
     > - **Shell:** `export GEMINI_API_KEY=your-key`
     >
     > Get your API key at: https://aistudio.google.com/apikey
   - Example: python3 found, gemini-image.py exists, API key valid → proceed
   - Tool: Bash

2. **List Available Models**
   - Check which models are available and their capabilities
   - IF: checking local registry → `<GI_CLI> models`
   - IF: checking what's live on the API → `<GI_CLI> models --remote` (requires API key)
   - Example: `<GI_CLI> models` → lists curated local models with create/edit support
   - Example: `<GI_CLI> models --remote` → queries Gemini API for all available models
   - Example: `<GI_CLI> models --json` → raw JSON for scripting
   - Tool: Bash `<GI_CLI> models [--remote] [--json]`

3. **Create Image (Text to Image)**
   - Generate a new image from a text prompt
   - IF: no `--model` → uses DEFAULT_CREATE_MODEL
   - IF: no `--size` → uses DEFAULT_SIZE
   - IF: no `--output` → saves as `output.png` in current directory
   - IF: safety filter triggers (empty response) → rephrase prompt to be more specific, less ambiguous
   - IF: rate limit (429) → wait and retry. Imagen 4 has generous limits; Gemini Flash free tier is stricter
   - Build descriptive, specific prompts. The more detail, the better the result.
   - Example: `<GI_CLI> create "a watercolor painting of a mountain lake at sunset" --output lake.png`
   - Example: `<GI_CLI> create "pixel art treasure chest, 32x32 sprite" --size 1024x1024 --output chest.png`
   - Example: `<GI_CLI> create "photo of a red sports car" --model gemini-2.0-flash-exp --output car.png`
   - Tool: Bash `<GI_CLI> create <prompt> [--output <path>] [--size <WxH>] [--model <id>]`

4. **Edit Image (Image + Instruction)**
   - Modify an existing image based on a text instruction
   - IF: no `--model` → uses DEFAULT_EDIT_MODEL
   - IF: no `--output` → saves as `edited.png`
   - IF: user wants to overwrite → set `--output` same as `--input`
   - Describe what to CHANGE, not what to keep. Good: "Make the sky orange." Bad: "Keep everything but change the sky."
   - Example: `<GI_CLI> edit "change the background to a beach" --input photo.png --output beach.png`
   - Example: `<GI_CLI> edit "remove the text overlay" --input screenshot.png --output clean.png`
   - Tool: Bash `<GI_CLI> edit <instruction> --input <source> [--output <path>] [--model <id>]`

5. **Inspect and Iterate**
   - Read the generated image to visually verify the result
   - Check for common AI artifacts: extra limbs, baked-in text, wrong colors, white borders, blur
   - IF: result needs small fixes → use `edit` command on the output
   - IF: result is fundamentally wrong → adjust prompt and `create` again
   - Example: Read output.png → spots extra finger → `<GI_CLI> edit "remove the extra finger on the left hand" --input output.png --output fixed.png`
   - Tool: Read (to view image), then Bash (to edit/recreate)

## Common Sizes

| Use case | Size | Aspect |
|----------|------|--------|
| Landscape / cover art | `1280x960` | 4:3 |
| Portrait | `960x1280` | 3:4 |
| Square / icon | `1024x1024` | 1:1 |
| Widescreen | `1536x864` | 16:9 |
| Mobile / story | `864x1536` | 9:16 |
