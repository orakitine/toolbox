---
name: handoff
description: >-
  Compacts the current conversation into a handoff document so a fresh agent can
  pick up the work. Use when user says "handoff", "hand off", "create handoff",
  "handoff doc", "pass to next session", "summarize for next agent", or invokes
  /handoff. Optional argument describes what the next session will focus on.
argument-hint: "What will the next session be used for?"
---

# Purpose

Produces a single self-contained markdown document that captures everything a fresh agent needs to resume the current work — context, decisions, open threads, suggested skills — without re-reading the entire conversation. Written to the OS temp directory so it never pollutes the workspace, and free of duplicated content that already lives in PRDs, plans, ADRs, issues, commits, or diffs.

## Workflow

1. **Capture Intent**
   - IF: user passed an argument → treat it as the description of what the next session will focus on, and tailor the document toward that focus
   - IF: no argument → write a general-purpose handoff covering the full current task
   - Example: `/handoff finish the auth refactor` → emphasize auth-refactor state, deprioritize unrelated tangents
   - Example: `/handoff` (no arg) → cover everything currently in flight

2. **Pick the Output Path**
   - Save to the OS temp directory — NEVER the current workspace
   - Use `$TMPDIR` on macOS/Linux, `%TEMP%` on Windows; fall back to `/tmp` if neither is set
   - Filename: `handoff-<short-slug>-<YYYYMMDD-HHMMSS>.md` where the slug is derived from the next-session focus (or "session" if none)
   - Example: `/tmp/handoff-auth-refactor-20260522-141033.md`
   - Example: `$TMPDIR/handoff-session-20260522-141033.md`

3. **Inventory External Artifacts First**
   - Before summarizing anything, list the artifacts that already capture the work: PRDs, design docs, plan files, ADRs, GitHub issues/PRs, commits, uncommitted diffs, tickets
   - The handoff REFERENCES these by path or URL — it does NOT duplicate their content
   - Example: "Plan: `./docs/plans/auth-refactor.md`" — do not re-list the plan steps in the handoff
   - Example: "Open PR: https://github.com/org/repo/pull/482" — do not paste the PR description

4. **Draft the Handoff Document**
   - Use this section order, omitting any section that genuinely has nothing to say:
     - `# Handoff: <one-line task title>`
     - `## Next session focus` — one paragraph echoing the user's argument (or inferred goal)
     - `## Context` — minimal background: what is being done and why, only what isn't obvious from referenced artifacts
     - `## Referenced artifacts` — bulleted list of paths/URLs from step 3
     - `## State` — where things stand right now: what is done, what is in progress, what is blocked
     - `## Decisions made` — notable choices the next agent should not relitigate, with one-line rationale each
     - `## Open questions` — unresolved threads, with the option(s) under consideration if any
     - `## Suggested skills` — REQUIRED — skills the next agent should invoke for this work, with a one-line "why" per skill
     - `## How to resume` — concrete first move(s) for the next agent
   - Example "Suggested skills" entry: `- quality-gate — run before claiming the refactor is done`
   - Example "How to resume" entry: `1. Read referenced plan. 2. Run quality-gate. 3. Address remaining lint errors in src/auth/.`

5. **Redact Sensitive Material**
   - Scrub API keys, tokens, passwords, secrets, private URLs with embedded credentials, PII (emails, phone numbers, addresses, real names tied to private context)
   - Replace with a placeholder that explains what was removed
   - Example: `sk-live-abc123...` → `<REDACTED: Stripe live secret key — retrieve from 1Password vault "engineering">`
   - Example: `user@private.example` → `<REDACTED: customer email>`

6. **Avoid Duplication**
   - Re-scan the draft against the artifact inventory from step 3
   - IF: a section restates what an artifact already contains → replace with a one-line pointer to that artifact
   - The handoff exists to add what the artifacts do not: live conversation state, in-flight decisions, ephemeral context
   - Example: Don't paste commit messages — write "See last 3 commits on `feat/auth-refactor`"
   - Example: Don't restate the PR's checklist — write "PR checklist tracks remaining work: <url>"

7. **Write and Report**
   - Write the file to the path chosen in step 2
   - Report the absolute file path back to the user as the final line of the response, so they can copy it into the next session
   - Example final line: `Handoff written: /tmp/handoff-auth-refactor-20260522-141033.md`
