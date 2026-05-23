# handoff

Compacts the current conversation into a portable handoff document so a fresh agent can pick up the work without re-reading the entire thread. The doc lands in the OS temp directory, references existing artifacts by path or URL instead of duplicating them, and always includes a "Suggested skills" section pointing the next agent at the right tools.

## Quick start

Trigger any of:

- `handoff`
- `create handoff`
- `hand off this session`
- `pass to next session`
- `/handoff`

Optional argument describes the next session's focus:

- `/handoff finish the auth refactor`
- `/handoff debug the failing CI job`

If you omit the argument, the doc is written as a general-purpose snapshot of the current work.

## What goes in the document

- **Next session focus** — what the next agent should optimize for
- **Context** — minimal background, only what isn't in referenced artifacts
- **Referenced artifacts** — pointers to PRDs, plans, ADRs, issues, PRs, commits, diffs
- **State** — done / in progress / blocked
- **Decisions made** — choices the next agent should not relitigate
- **Open questions** — unresolved threads
- **Suggested skills** — which skills to invoke and why (always included)
- **How to resume** — concrete first move for the next agent

## What is deliberately NOT in the document

- Anything already captured in a referenced artifact (the doc points to them instead)
- API keys, tokens, passwords, or PII — these are redacted with placeholders explaining what was removed

## Where it lands

Written to the OS temp directory, never to the workspace:

| OS | Location |
|---|---|
| macOS / Linux | `$TMPDIR` (falls back to `/tmp`) |
| Windows | `%TEMP%` |

Filename format: `handoff-<slug>-<YYYYMMDD-HHMMSS>.md`. The absolute path is printed as the last line of the response so you can paste it into the next session.

## Attribution

Adapted from [mattpocock/skills](https://github.com/mattpocock/skills). See `_attribution.md`.

## Related

- `fork-terminal` — fork the session into a new terminal window; pairs with handoff when you want the next agent to start fresh with the handoff doc pre-loaded.
- `skill-guide` — useful for the next agent to discover the skills you listed in "Suggested skills".
