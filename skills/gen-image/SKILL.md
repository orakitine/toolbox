---
name: gen-image
description: Generate or edit images using AI image models. Currently supports Google Gemini (Nano Banana Pro for creation, Nano Banana for editing). Provider-agnostic design. Use for image generation, visual content creation, or image editing tasks.
argument-hint: "[create|edit] [prompt or options]"
allowed-tools:
  - Bash
  - Read
---

Generate or edit images via AI image models. Generic — no style or domain knowledge. Higher-order skills build prompts and call the CLI scripts bundled here.

## Prerequisites

- `python3` must be available in PATH (no pip packages needed — stdlib only)
- `GEMINI_API_KEY` must be set. Add to one of:
  - Project `.env` (for project-level installs): `echo 'GEMINI_API_KEY=your-key' >> .env`
  - Global `~/.claude/.env` (for global installs): `echo 'GEMINI_API_KEY=your-key' >> ~/.claude/.env`
  - Or export directly: `export GEMINI_API_KEY=your-key`

API calls consume Google AI credits. Imagen 4 requires billing. Gemini Flash has a free tier but is rate-limited. See [Google AI pricing](https://ai.google.dev/pricing).

## Variables

GI_CLI: python3 ./gemini-image.py                     # Path to the Gemini image CLI
DEFAULT_CREATE_MODEL: gemini-3-pro-image-preview      # Nano Banana Pro. Best quality + character/text fidelity. Override with --model (e.g. imagen-4.0-generate-001 for cheaper batches)
DEFAULT_EDIT_MODEL: gemini-2.5-flash-image             # Nano Banana. Default for edits
DEFAULT_SIZE: 1280x960                                 # 4:3 landscape. Override with --size

## Workflow

1. **Check Prerequisites**
   - IF: `which python3` fails → report "python3 not found" and stop
   - IF: `./gemini-image.py` not found → report "gemini-image CLI missing" and stop
   - IF: API key not available → run `<GI_CLI> models` as a lightweight auth check. If it fails with "GEMINI_API_KEY not set", stop and tell the user:
     > GEMINI_API_KEY is not configured. Set it in one of:
     > - **Project-level:** add `GEMINI_API_KEY=your-key` to `./.env`
     > - **Global (recommended for personal use):** add `GEMINI_API_KEY=your-key` to `~/.claude/.env`
     > - **Shell:** `export GEMINI_API_KEY=your-key`
     >
     > Get your API key at: https://aistudio.google.com/apikey
   - Example: python3 found, gemini-image.py exists, API key valid → proceed
   - Tool: Bash

2. **Route Request**
   - IF: user asks to create an image → go to step 3
   - IF: user asks to edit an existing image → go to step 4
   - IF: user asks about available models → run `<GI_CLI> models` and report results
   - IF: user asks to check remote API models → run `<GI_CLI> models --remote`
   - Example: "generate a sunset painting" → step 3 (create)
   - Example: "make the sky orange in photo.png" → step 4 (edit)
   - Example: "what models can I use?" → `<GI_CLI> models`
   - Tool: Bash `<GI_CLI> models [--remote] [--json]`

3. **Create Image (Text to Image)**
   - Generate a new image from a text prompt
   - IF: no `--model` → uses DEFAULT_CREATE_MODEL
   - IF: no `--size` → uses DEFAULT_SIZE
   - IF: no `--output` → saves as `output.png` in current directory
   - IF: safety filter triggers (empty response) → rephrase prompt to be more specific, less ambiguous
   - IF: rate limit (429) → wait and retry. Imagen 4 has generous limits; Gemini Flash free tier is stricter
   - Enrich vague prompts with specific details (style, lighting, composition, colors) before calling the API
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

## Reference

- IF: need full CLI flags, supported sizes, or model details → read `reference/commands.md`
- IF: need to add a new provider → see `gemini-image.py` as the reference implementation contract
