# setup-toolbox-context

Scaffolds the `CONTEXT.md` glossary and `docs/adr/` directory that `grill-with-docs` and `improve-codebase-architecture` expect. Detects existing state and creates files lazily — never leaves empty placeholders behind.

## Quick start

```
/setup-toolbox-context
```

Optional flag: `--single` (one CONTEXT.md at root) or `--multi` (CONTEXT-MAP.md + per-module CONTEXT.md, typical for monorepos). If omitted, the skill detects the layout from the repo, or asks once.

## What it produces

| Layout | Files created |
|---|---|
| Single-context | `CONTEXT.md` at repo root (with seed terms you supply) |
| Multi-context | `CONTEXT-MAP.md` at root + per-module `CONTEXT.md` files (with descriptions you supply) |
| Always | `docs/adr/README.md` (convention stub — no empty ADR placeholders) |
| Optional | "Domain Documentation" section appended to `CLAUDE.md` or `AGENTS.md` |

## When to use

- Starting a new project
- Adopting the CONTEXT.md convention on an existing repo
- Before first use of `grill-with-docs` or `improve-codebase-architecture`

## Related

- `grill-with-docs` — grows the glossary and records ADRs from design conversations
- `improve-codebase-architecture` — consumes the glossary and ADRs to find deepening opportunities

## Provenance

Inspired by Matt Pocock's `setup-matt-pocock-skills` (scope reduced — issue-tracker and triage-label scaffolding deliberately omitted). Format conventions follow `grill-with-docs/references/CONTEXT-FORMAT.md` and `grill-with-docs/references/ADR-FORMAT.md`.
