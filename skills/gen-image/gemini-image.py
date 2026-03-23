#!/usr/bin/env python3
"""
gemini-image — CLI for image generation and editing via Google Gemini APIs.

Designed to be driven by Claude Code skills.
All output is human-readable by default, JSON with --json.

Usage: python3 gemini-image.py <command> [options]

Environment: GEMINI_API_KEY (required)

Key resolution order:
  1. GEMINI_API_KEY in environment (explicit export, CI, etc.)
  2. ./.env in current working directory
  3. ~/.claude/.env (global fallback for personal keys)
"""

import base64
import json
import os
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path


API_BASE = "https://generativelanguage.googleapis.com/v1beta"

# Model registry — single source of truth for supported models
MODELS = {
    "imagen-4.0-generate-001": {
        "name": "Imagen 4",
        "api": "imagen",
        "capabilities": ["create"],
        "notes": "Best quality. Requires billing.",
    },
    "gemini-2.0-flash-exp": {
        "name": "Gemini 2.0 Flash (experimental)",
        "api": "gemini",
        "capabilities": ["create", "edit"],
        "notes": "Free tier, rate-limited. Experimental.",
    },
    "gemini-2.5-flash-preview-image-generation": {
        "name": "Gemini 2.5 Flash Preview",
        "api": "gemini",
        "capabilities": ["create", "edit"],
        "notes": "Preview. Free tier, rate-limited.",
    },
}

DEFAULT_CREATE_MODEL = "imagen-4.0-generate-001"
DEFAULT_EDIT_MODEL = "gemini-2.0-flash-exp"


# ── .env loading ──────────────────────────────────────────────────────────────

def load_env(path):
    if not os.path.exists(path):
        return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, val = line.split("=", 1)
            key = key.strip()
            val = val.strip().strip("\"'")
            if key not in os.environ:
                os.environ[key] = val


# Load .env files: project first, then global fallback
load_env(".env")
load_env(os.path.join(Path.home(), ".claude", ".env"))


# ── Helpers ───────────────────────────────────────────────────────────────────

def get_api_key():
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        print("Error: GEMINI_API_KEY not set", file=sys.stderr)
        print("Set it in one of:", file=sys.stderr)
        print("  1. Environment variable (export GEMINI_API_KEY=...)", file=sys.stderr)
        print("  2. ./.env (project-level)", file=sys.stderr)
        print("  3. ~/.claude/.env (global fallback)", file=sys.stderr)
        print("", file=sys.stderr)
        print("Get your API key at: https://aistudio.google.com/apikey", file=sys.stderr)
        sys.exit(1)
    return key


def parse_args(args):
    """Parse --flag value pairs and positional args, matching el.py convention."""
    flags = {}
    positional = []
    i = 0
    while i < len(args):
        arg = args[i]
        if arg.startswith("--"):
            key = arg[2:]
            if i + 1 < len(args) and not args[i + 1].startswith("--"):
                flags[key] = args[i + 1]
                i += 2
            else:
                flags[key] = "true"
                i += 1
        else:
            positional.append(arg)
            i += 1
    return flags, positional


def get_aspect_ratio(w, h):
    """Map WxH to nearest supported Gemini aspect ratio."""
    ratio = w / h
    if abs(ratio - 1) < 0.1:
        return "1:1"
    if abs(ratio - 16 / 9) < 0.15:
        return "16:9"
    if abs(ratio - 4 / 3) < 0.15:
        return "4:3"
    if abs(ratio - 3 / 4) < 0.15:
        return "3:4"
    if abs(ratio - 9 / 16) < 0.15:
        return "9:16"
    return "4:3"


def parse_size(size_str):
    """Parse WIDTHxHEIGHT string, return (w, h) or exit on error."""
    parts = size_str.split("x")
    if len(parts) != 2:
        print(f"Invalid size: {size_str}. Use format WIDTHxHEIGHT (e.g., 1280x960)", file=sys.stderr)
        sys.exit(1)
    try:
        return int(parts[0]), int(parts[1])
    except ValueError:
        print(f"Invalid size: {size_str}. Width and height must be integers.", file=sys.stderr)
        sys.exit(1)


def resolve_model(model_id, command):
    """Validate model supports the requested command. Warn if unknown."""
    if model_id in MODELS:
        info = MODELS[model_id]
        if command not in info["capabilities"]:
            supported = ", ".join(info["capabilities"])
            print(f"Error: {model_id} does not support '{command}' (supports: {supported})", file=sys.stderr)
            sys.exit(1)
        return info["api"]
    # Unknown model — let the API decide, guess API type from name
    print(f"Warning: Unknown model '{model_id}', attempting anyway...", file=sys.stderr)
    return "imagen" if "imagen" in model_id else "gemini"


def api_get(url):
    """GET from Gemini API, return parsed JSON."""
    api_key = get_api_key()
    req = urllib.request.Request(
        url,
        headers={"x-goog-api-key": api_key},
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"API error ({e.code}): {body}", file=sys.stderr)
        sys.exit(1)


def api_request(url, payload):
    """POST to Gemini API, return parsed JSON."""
    api_key = get_api_key()
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": api_key,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"API error ({e.code}): {body}", file=sys.stderr)
        sys.exit(1)


def write_image(image_bytes, output_path):
    """Write image bytes to file, creating parent dirs as needed."""
    path = Path(output_path).resolve()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(image_bytes)
    kb = len(image_bytes) / 1024
    return str(path), kb


# ── API Backends ──────────────────────────────────────────────────────────────

def call_imagen(prompt, model, aspect_ratio, sample_count=1):
    """Imagen API — text to image."""
    url = f"{API_BASE}/models/{model}:predict"
    data = api_request(url, {
        "instances": [{"prompt": prompt}],
        "parameters": {"sampleCount": sample_count, "aspectRatio": aspect_ratio},
    })
    predictions = data.get("predictions", [])
    if not predictions or "bytesBase64Encoded" not in predictions[0]:
        print(f"No image in Imagen response: {json.dumps(data, indent=2)}", file=sys.stderr)
        sys.exit(1)
    return base64.b64decode(predictions[0]["bytesBase64Encoded"])


def call_gemini(prompt, model, input_image_b64=None):
    """Gemini generateContent API — text to image or image editing."""
    url = f"{API_BASE}/models/{model}:generateContent"
    parts = []
    if input_image_b64:
        parts.append({"inlineData": {"mimeType": "image/png", "data": input_image_b64}})
    parts.append({"text": prompt})

    data = api_request(url, {
        "contents": [{"parts": parts}],
        "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]},
    })

    candidates = data.get("candidates", [])
    if not candidates:
        print(f"No candidates in Gemini response: {json.dumps(data, indent=2)}", file=sys.stderr)
        sys.exit(1)

    res_parts = candidates[0].get("content", {}).get("parts", [])
    for part in res_parts:
        inline = part.get("inlineData", {})
        if inline.get("mimeType", "").startswith("image/"):
            return base64.b64decode(inline["data"])

    for part in res_parts:
        if "text" in part:
            print(f"Model returned text instead of image: {part['text']}", file=sys.stderr)
            sys.exit(1)

    print(f"No image in Gemini response: {json.dumps(data, indent=2)}", file=sys.stderr)
    sys.exit(1)


# ── Commands ──────────────────────────────────────────────────────────────────

def cmd_models(flags, positional):
    if "remote" in flags:
        cmd_models_remote(flags)
        return

    if "json" in flags:
        print(json.dumps(MODELS, indent=2))
        return

    print("Available Models (local registry):\n")
    for model_id, info in MODELS.items():
        caps = ", ".join(info["capabilities"])
        print(f"  {model_id}")
        print(f"    {info['name']} — {caps}")
        print(f"    {info['notes']}")
        default_tags = []
        if model_id == DEFAULT_CREATE_MODEL:
            default_tags.append("default for create")
        if model_id == DEFAULT_EDIT_MODEL:
            default_tags.append("default for edit")
        if default_tags:
            print(f"    [{', '.join(default_tags)}]")
        print()
    print("  Tip: use --remote to query the API for all available models")


def cmd_models_remote(flags):
    """Fetch models from the Gemini API and show image-capable ones."""
    print("Fetching models from Gemini API...", file=sys.stderr)
    data = api_get(f"{API_BASE}/models")
    models = data.get("models", [])

    # Filter for image-relevant models (generateContent or predict)
    image_models = []
    for m in models:
        methods = m.get("supportedGenerationMethods", [])
        model_id = m.get("name", "").replace("models/", "")
        desc = m.get("description", "")
        display_name = m.get("displayName", model_id)

        # Include models that support generateContent (potential image gen) or predict (Imagen)
        has_generate = "generateContent" in methods
        has_predict = "predict" in methods
        if not has_generate and not has_predict:
            continue

        # Tag if it's in our local registry
        local = MODELS.get(model_id)
        image_models.append({
            "model_id": model_id,
            "display_name": display_name,
            "description": desc,
            "methods": methods,
            "in_local_registry": local is not None,
        })

    if "json" in flags:
        print(json.dumps(image_models, indent=2))
        return

    print(f"\nModels from API ({len(image_models)} with generateContent/predict):\n")
    for m in image_models:
        tag = " [local]" if m["in_local_registry"] else ""
        methods = ", ".join(m["methods"])
        print(f"  {m['model_id']}{tag}")
        print(f"    {m['display_name']} — {methods}")
        if m["description"]:
            print(f"    {m['description'][:120]}")
        print()


def cmd_create(flags, positional):
    prompt = positional[0] if positional else flags.get("prompt")
    if not prompt:
        print("Usage: gemini-image create <prompt> [--output <path>] [--size <WxH>] [--model <id>]", file=sys.stderr)
        sys.exit(1)

    model = flags.get("model", DEFAULT_CREATE_MODEL)
    size = flags.get("size", "1280x960")
    output = flags.get("output", "output.png")
    w, h = parse_size(size)
    aspect_ratio = get_aspect_ratio(w, h)
    api_type = resolve_model(model, "create")

    print(f"Creating image...", file=sys.stderr)
    print(f"  Model: {model}", file=sys.stderr)
    print(f"  Size: {size} (aspect ratio: {aspect_ratio})", file=sys.stderr)
    print(f"  Output: {output}", file=sys.stderr)
    print(f"  Prompt: {prompt[:150]}{'...' if len(prompt) > 150 else ''}", file=sys.stderr)

    start = time.time()

    if api_type == "imagen":
        image_bytes = call_imagen(prompt, model, aspect_ratio)
    else:
        image_bytes = call_gemini(prompt, model)

    path, kb = write_image(image_bytes, output)
    elapsed = time.time() - start

    if "json" in flags:
        print(json.dumps({"model": model, "output": path, "size_kb": round(kb, 1), "elapsed_s": round(elapsed, 1)}))
    else:
        print(f"Done: {path} ({kb:.0f} KB, {elapsed:.1f}s)")


def cmd_edit(flags, positional):
    prompt = positional[0] if positional else flags.get("prompt")
    if not prompt:
        print("Usage: gemini-image edit <instruction> --input <source> [--output <path>] [--model <id>]", file=sys.stderr)
        sys.exit(1)

    input_path = flags.get("input")
    if not input_path:
        print("Error: --input <source_image> is required for edit", file=sys.stderr)
        sys.exit(1)

    resolved_input = Path(input_path).resolve()
    if not resolved_input.exists():
        print(f"Input file not found: {resolved_input}", file=sys.stderr)
        sys.exit(1)

    model = flags.get("model", DEFAULT_EDIT_MODEL)
    output = flags.get("output", "edited.png")
    api_type = resolve_model(model, "edit")

    if api_type == "imagen":
        print("Error: Imagen models do not support editing. Use a Gemini model.", file=sys.stderr)
        sys.exit(1)

    print(f"Editing image...", file=sys.stderr)
    print(f"  Model: {model}", file=sys.stderr)
    print(f"  Input: {input_path}", file=sys.stderr)
    print(f"  Output: {output}", file=sys.stderr)
    print(f"  Instruction: {prompt[:150]}{'...' if len(prompt) > 150 else ''}", file=sys.stderr)

    start = time.time()

    input_b64 = base64.b64encode(resolved_input.read_bytes()).decode()
    image_bytes = call_gemini(prompt, model, input_b64)

    path, kb = write_image(image_bytes, output)
    elapsed = time.time() - start

    if "json" in flags:
        print(json.dumps({"model": model, "input": str(resolved_input), "output": path, "size_kb": round(kb, 1), "elapsed_s": round(elapsed, 1)}))
    else:
        print(f"Done: {path} ({kb:.0f} KB, {elapsed:.1f}s)")


# ── Main ──────────────────────────────────────────────────────────────────────

HELP = """gemini-image — Gemini image generation and editing CLI

Commands:
  models [--remote]               List available models (--remote queries API)
  create <prompt> [--output <path>] [--size <WxH>] [--model <id>]
                                  Generate image from text prompt
  edit <instruction> --input <source> [--output <path>] [--model <id>]
                                  Edit existing image with instruction

Global flags:
  --json                          Output raw JSON

Defaults:
  create model: imagen-4.0-generate-001 (Imagen 4)
  edit model:   gemini-2.0-flash-exp (Gemini 2.0 Flash)
  size:         1280x960 (4:3 landscape)
  output:       output.png (create) / edited.png (edit)

Environment:
  GEMINI_API_KEY                  Required. Your Google AI Studio API key.
                                  Get one at: https://aistudio.google.com/apikey
"""

COMMANDS = {
    "models": cmd_models,
    "create": cmd_create,
    "edit": cmd_edit,
}


def main():
    args = sys.argv[1:]
    if not args or args[0] in ("help", "--help", "-h"):
        print(HELP)
        sys.exit(0)

    command = args[0]
    if command not in COMMANDS:
        print(f"Unknown command: {command}", file=sys.stderr)
        print("Run 'gemini-image help' for usage.", file=sys.stderr)
        sys.exit(1)

    flags, positional = parse_args(args[1:])
    COMMANDS[command](flags, positional)


if __name__ == "__main__":
    main()
