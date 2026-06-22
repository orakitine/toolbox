# Toolbox

## What This Is

Public repo of stable Claude Code skills, agents, and prompts. The **single source of truth** that the registry (`~/.claude/skills/registry/`) points at.

- **Repo**: https://github.com/orakitine/toolbox.git
- **Local**: ~/Documents/toolbox
- **Registry**: https://github.com/orakitine/registry.git (installed at ~/.claude/skills/registry/)

## Companion Repos

- **registry** (`~/.claude/skills/registry/`) — catalog of pointers to skills. `/registry add` registers skills from this repo.
- **claude-code-lab** — experimentation/prototyping. Skills graduate from lab → toolbox when stable.
- **toolbox-private** (planned) — same structure, private repo for sensitive skills.

## Workflow

1. Prototype skills in `claude-code-lab`
2. Graduate stable skills here under `skills/<name>/SKILL.md`
3. Register them: `/registry add <name> skill from https://github.com/orakitine/toolbox/blob/main/skills/<name>/SKILL.md`
4. Use anywhere: `/registry use <name>`

## Structure

```
skills/<name>/SKILL.md          # Each skill gets its own directory
  cookbook/                      # Scenario-specific workflows
  reference/ (or references/)    # Heavy reference material
  scripts/                       # Executable helpers
agents/<name>.md                # Agent configurations
prompts/<name>.md               # Reusable prompts (currently empty)
audio/                          # Sample/asset audio output
docs/                           # Repo documentation
```

## Methodology Convention

Several skills share two project artifacts as their backbone — scaffold them with `setup-toolbox-context`:

- **`CONTEXT.md`** — domain glossary (single-context) or `CONTEXT-MAP.md` + per-context `CONTEXT.md` (multi-context).
- **`docs/adr/`** — architecture decision records.

`grill-with-docs` and `improve-codebase-architecture` read and write these; `zoom-out` uses the glossary vocabulary. New skills that touch planning/design should integrate with this convention rather than inventing their own.

## Skill Awareness (Three-Tier Model)

Skills advertise how they compose. Because the registry distributes each skill **individually** (it copies the skill's own directory; this `CLAUDE.md` does NOT travel), cross-skill synergy must live in the skill itself to be discoverable downstream.

1. **Hard dependency** → `registry.yaml` `requires` field (auto-installs recursively). Use only when a skill literally cannot run without another.
2. **Soft synergy** → a `## Works well with` section in the skill's own `SKILL.md`. Names *optional* collaborators with **graceful degradation** (the skill must still run if the neighbor is absent). Travels with the skill.
3. **Scenarios / recipes** → multi-step workflows that chain 3+ skills live in [`docs/skills-playbook.md`](docs/skills-playbook.md), the single source of truth for composition. Local onboarding only; does not travel.

**MANDATE for new skills:** every new toolbox skill with a real collaborator MUST include a `## Works well with` section (soft synergy, graceful degradation, pairwise adjacency only — no multi-step recipes, no outbound pointer to the playbook). Skills with genuinely no collaborator omit the section. This convention is toolbox-local, so it lives here, NOT in `skill-forge` (which stays portable / agentskills.io-universal).

## Scenarios

How the skills compose — recipes, the CONTEXT.md/ADR convention, and per-skill quick reference — all live in **[`docs/skills-playbook.md`](docs/skills-playbook.md)**. (Composition is a graph with multiple entry points, not one rigid pipeline.)

## Skills

### Capability skills

- **browser** — Headless browser automation via playwright-cli. Core capability skill.
- **browser-microscope** — Real-browser DOM/layout forensics. Hit-tests why a click won't land, dumps scroll/box geometry, reads live CSS tokens, sweeps viewport widths to find breakpoint bugs. Drives the local Playwright npm package. Complements browser/browser-qa.
- **browser-review** — Parallel UI validation. Discovers user stories, fans out browser-qa agents, aggregates pass/fail results.
- **browser-workflow** — Loads and executes saved browser automation workflows through the browser skill.
- **doc-cache** — Transparent read-through cache for documentation lookups with expiration and garbage collection.
- **elevenlabs** — TTS, sound effects, music generation, audio processing via ElevenLabs API. Bundled Python CLI.
- **fork-terminal** — Fork a terminal session to a new window with a command or agentic coding tool. Supports context handoff.
- **gen-image** — Image generation and editing via AI models (Gemini/Imagen). Provider-agnostic design with bundled Python CLI.
- **menu-app** — Converts restaurant menu files (PDF, image, Word, HTML, MD) into self-contained single-page HTML ordering apps with search, cart, and order text export.
- **speak** — Provider-agnostic TTS output with audio caching. Text in, audio out. Caches generated audio to skip redundant API calls on repeated phrases. Falls back through elevenlabs → macOS say.

### Engineering-methodology skills

- **setup-toolbox-context** — Scaffolds the `CONTEXT.md` glossary and `docs/adr/` directory the methodology skills expect. Single- or multi-context layout.
- **living-plan** — Authors and maintains a living, executable Markdown plan in `docs/plans/`. Fixed goal (Purpose + Definition of Done), living path (4-state status checklist, append-only amendments, cross-agent metadata). Reads `CONTEXT.md`, links ADRs (never writes them), and `build` delegates implementation to `tdd`. Adapted from [disler/planf3](https://github.com/disler/planf3) — Markdown-first, image generation removed.
- **grill-me** — Relentless interview that walks the decision tree of a plan/design one question at a time, each with a recommended answer, until both sides share a mental model.
- **grill-with-docs** — Grilling interview that stress-tests a plan against `CONTEXT.md` and `docs/adr/`, sharpening terminology and updating those docs inline as decisions crystallise.
- **improve-codebase-architecture** — Finds deepening opportunities (shallow → deep modules) informed by `CONTEXT.md` and ADRs. Aims at testability and AI-navigability.
- **zoom-out** — Pulls up a layer of abstraction and maps surrounding modules/callers using the project's domain glossary. Counters tunnel vision.
- **tdd** — Red-green-refactor via vertical slices (one test → one implementation). Tests verify behavior through public interfaces.
- **diagnose** — Disciplined diagnosis loop for hard bugs and perf regressions: reproduce, minimise, hypothesise, instrument, fix, regression-test.
- **handoff** — Compacts the current conversation into a self-contained handoff doc (written to temp) so a fresh agent can resume work. References existing plans/ADRs/PRs rather than duplicating them.

### Meta skills

- **skill-forge** — Meta-skill for creating, evaluating, and refining skills, agents, and commands.
- **skill-guide** — Discovers and explains installed skills/agents. Inventory, detail, and recommend modes.

### Modes

- **caveman** — Ultra-compressed communication mode (~75% fewer tokens) preserving technical accuracy.

## Agents

- **browser-operator** — General-purpose browser automation agent. Parallel-safe.
- **browser-qa** — UI validation agent. Structured pass/fail reporting with screenshots.
- **elevenlabs-operator** — Audio generation agent. Parallel-safe.
- **gen-image-operator** — Image generation and editing agent (Gemini/Imagen). Parallel-safe.
- **elevenlabs-voice-designer** — Voice casting agent. Audition samples with structured recommendations.
- **speak-narrator** — Narration agent. Digests content into spoken summaries via the speak skill.
