# caveman

Ultra-compressed communication mode. Drops filler, articles, and pleasantries from every response while preserving technical substance, code, and error messages verbatim. Cuts ~75% of output tokens.

## Quick start

Trigger any of:

- `caveman mode`
- `talk like caveman`
- `be brief`
- `less tokens`
- `/caveman`

The next response will already be in caveman style. Mode persists across every turn until you say `stop caveman` or `normal mode`.

## When it stays normal

The skill auto-drops caveman temporarily for:

- Security warnings
- Confirmations of irreversible actions
- Multi-step sequences where fragment order could be misread
- When you ask for clarification or repeat a question

Caveman resumes immediately after the clarification.

## Examples

| Verbose | Caveman |
|---|---|
| "Sure! I'd be happy to help. The issue is likely caused by..." | "Bug in auth middleware. Token expiry check use `<` not `<=`. Fix:" |
| "This React component re-renders because..." | "Inline obj prop -> new ref -> re-render. `useMemo`." |

## Attribution

Adapted from [mattpocock/skills](https://github.com/mattpocock/skills). See `_attribution.md`.

## Related

- `speak` — converts text to audio. Pairs well with caveman for terse spoken summaries.
