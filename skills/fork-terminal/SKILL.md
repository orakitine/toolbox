---
name: fork-terminal
description: Fork a terminal session to a new window with a command or agentic coding tool (Claude Code, Codex CLI, Gemini CLI). Supports context handoff. Use when the user requests 'fork terminal', 'new terminal', or 'fork session'.
argument-hint: "[tool] <task>"
disable-model-invocation: true
allowed-tools:
  - Bash
  - Read
---

# Purpose

Open a new terminal window and run a command in it. Supports raw CLI commands and agentic coding tools (Claude Code, Codex CLI, Gemini CLI) with optional conversation context handoff.

## Prerequisites

- macOS or Windows (uses AppleScript on macOS, `cmd` on Windows)
- For agentic tools: the respective CLI must be installed and in PATH

## Variables

FORK_TOOL: python3 ${CLAUDE_SKILL_DIR}/scripts/fork_terminal.py    # Terminal forking script

## Workflow

1. **Parse Request**
   - Extract: tool name (or raw CLI), task description, whether context handoff is requested
   - IF: user mentions "claude code", "claude" → tool is `claude-code`
   - IF: user mentions "codex" → tool is `codex-cli`
   - IF: user mentions "gemini" → tool is `gemini-cli`
   - IF: user mentions a CLI tool (ffmpeg, curl, python, etc.) or no agentic tool → tool is `raw-cli`
   - IF: user mentions "summary", "summarize", "include context", "with context" → context handoff requested
   - Example: "fork terminal use claude code to fix tests" → tool=claude-code, task="fix tests", context=no
   - Example: "new terminal with ffmpeg to convert video.mp4" → tool=raw-cli, task="ffmpeg convert video.mp4"

2. **Check Prerequisites**
   - IF: `${CLAUDE_SKILL_DIR}/scripts/fork_terminal.py` not found → report missing and stop
   - IF: agentic tool requested → verify binary is in PATH (`which claude`, `which codex`, `which gemini`)
   - IF: raw CLI → verify the command exists (`which <command>`)
   - Example: `which claude` succeeds → proceed
   - Tool: Bash

3. **Handle Context Handoff (Agentic Tools Only)**
   - IF: context handoff requested AND tool is agentic
   - THEN: Read `${CLAUDE_SKILL_DIR}/prompts/context-handoff.md` template
   - Fill the template in memory (do NOT modify the file):
     - Replace `{{CONVERSATION_SUMMARY}}` with a concise summary of the conversation so far
     - Replace `{{NEXT_TASK}}` with the user's task for the forked session
   - The filled template becomes the task/prompt for the next step
   - IF: no context handoff → use the raw task as-is
   - Example: user says "fork claude with context to refactor auth" → build summary, use as prompt
   - Tool: Read

4. **Build Command**
   - IF: raw CLI → construct command directly from user's request
   - IF: agentic tool → use the reference table below to build the command with the task from step 3
   - IF: user specifies a model → pass it through with the tool's model flag
   - IF: user does not specify a model → omit the model flag (let the tool use its own default)
   - Example: raw CLI → `ffmpeg -i input.mp4 -c:v libvpx-vp9 output.webm`
   - Example: claude-code → `claude -p "fix tests" --dangerously-skip-permissions`
   - Example: codex with model → `codex -m o3 --dangerously-bypass-approvals-and-sandbox "fix tests"`
   - Tool: None (construct in memory)

5. **Fork Terminal**
   - Execute: `<FORK_TOOL> <constructed_command>`
   - Reports success or failure
   - Example: `python3 ${CLAUDE_SKILL_DIR}/scripts/fork_terminal.py claude -p "fix tests" --dangerously-skip-permissions`
   - Tool: Bash

## Agentic Tool Reference

| Tool | Binary | Prompt Flag | Model Flag | Auto-Approve Flag |
|------|--------|-------------|------------|-------------------|
| claude-code | `claude` | `-p "<task>"` | `--model <model>` | `--dangerously-skip-permissions` |
| codex-cli | `codex` | `"<task>"` (positional, last) | `-m <model>` | `--dangerously-bypass-approvals-and-sandbox` |
| gemini-cli | `gemini` | `-i "<task>"` (must be last) | `--model <model>` | `--yolo` |
