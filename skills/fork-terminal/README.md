# fork-terminal

Fork a terminal session to a new window with a command or agentic coding tool.

## Quick Start

```
/fork-terminal claude code fix the failing tests
```

## Options

| Variable | Default | Description |
|---|---|---|
| FORK_TOOL | python3 ${CLAUDE_SKILL_DIR}/scripts/fork_terminal.py | Terminal forking script |

## Prerequisites

- macOS or Windows
- For agentic tools: respective CLI must be installed (`claude`, `codex`, `gemini`)

## Supported Tools

| Tool | Example |
|------|---------|
| Claude Code | `"fork terminal use claude to fix tests"` |
| Codex CLI | `"fork terminal use codex to refactor module"` |
| Gemini CLI | `"fork terminal use gemini to review code"` |
| Raw CLI | `"fork terminal with ffmpeg to convert video.mp4"` |

## Features

- **Context handoff** — say "with context" or "include summary" to pass conversation history to the forked agent
- **Model passthrough** — specify any model and it gets passed to the tool's model flag
- **Auto-approve** — forked agents run with permissions bypassed for fire-and-forget execution

## Examples

- `"fork terminal use claude code to fix tests"` — Claude Code in new terminal
- `"new terminal with codex to refactor the auth module"` — Codex CLI
- `"fork session use gemini with context to implement feature X"` — Gemini with conversation summary
- `"create terminal to run python -m http.server 8000"` — raw CLI command
