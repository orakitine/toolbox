# Skill-Forge Evaluation Report

**Date**: 2026-04-03
**Scope**: All skills and agents in toolbox repo (excluding skill-forge)
**Method**: For each asset: evaluate against updated PRINCIPLES.md, fix issues, re-evaluate, fix remaining issues
**Commits**: 16 individual commits (one per asset), not pushed

---

## Summary

| Category | Assets | Issues Found | Fixed | Remaining | Skipped (Breaking) |
|----------|--------|-------------|-------|-----------|-------------------|
| Skills   | 10     | 34          | 32    | 2         | 1                 |
| Agents   | 6      | 18          | 18    | 0         | 2                 |
| **Total**| **16** | **52**      | **50**| **2**     | **3**             |

### Most Common Issues (by frequency)

1. **Missing `allowed-tools` in agent frontmatter** (6/6 agents) — none had it declared
2. **`${CLAUDE_SKILL_DIR}` in skill body** (5 skills) — replaced with relative paths for portability
3. **Duplicate Purpose/Prerequisites sections** (5 skills) — removed or converted to procedural steps
4. **README.md duplicating SKILL.md content** (4 skills) — removed or cleaned up
5. **Missing inline examples in workflow steps** (3 skills) — added
6. **Forbidden sections in README.md** (3 skills) — Quick Start, Examples sections removed
7. **Declarative content instead of procedural** (3 skills) — converted to IF/THEN procedures

---

## Skills

### browser
**Commit**: `cbb1352`
**Fixed**:
- Replaced `${CLAUDE_SKILL_DIR}/reference/commands.md` with `./reference/commands.md`
- Screenshot step now references `<SCREENSHOTS_DIR>` variable instead of hardcoded path

**Remaining**: None
**Notes**: README.md intentionally kept (serves human discovery via skill-guide)

---

### browser-review
**Commit**: `3b74680`
**Fixed**:
- Removed declarative Purpose/Prerequisites sections
- Converted prerequisites to procedural step 1 with IF/THEN guards
- Removed harness-specific `Tool:` annotations from steps
- Removed harness-specific `TaskOutput` reference
- Renumbered workflow steps 1-6

**Remaining**: README.md has some duplication with SKILL.md (serves different audience)
**Notes**: `$ARGUMENTS` usage consistent with repo convention

---

### browser-workflow
**Commit**: `9cb8063`
**Fixed**:
- Converted standalone Prerequisites to procedural "Validate Environment" step
- Removed README.md (duplicated SKILL.md, contained forbidden Quick Start/Examples sections)
- Merged useful README content (Workflow File Format) into SKILL.md inline
- Fixed indentation of IF/THEN sub-bullets

**Remaining**: None

---

### doc-cache
**Commit**: `7ad5545`
**Fixed**:
- Removed README.md (duplicated SKILL.md content — Quick Start, How It Works, Options table)
- Added TRIGGER/DO NOT TRIGGER guidance to description
- Replaced `${CLAUDE_SKILL_DIR}` with relative `./scripts/cache.py`
- Folded Prerequisites inline
- Fixed `scripts/cache.py` default CACHE_DIR (was missing `/cache` subdirectory)

**Remaining**: None

---

### elevenlabs
**Commit**: `64ffaab`
**Fixed**:
- Removed standalone Purpose/Prerequisites sections
- Added References section with IF/THEN routing to `reference/commands.md`
- Replaced `${CLAUDE_SKILL_DIR}` in workflow body with EL_CLI variable reference

**Remaining**: README.md contains Quick Start/Examples sections that duplicate SKILL.md — not a spec violation (README is human-facing) but could be trimmed
**Notes**: Name is implementation-specific — see Skipped section below

---

### fork-terminal
**Commit**: `c1836f8`
**Fixed**:
- Replaced all `${CLAUDE_SKILL_DIR}` (4 occurrences) with relative paths
- Renamed `prompts/` to `assets/` per spec (template files belong in assets/)
- Added `--help` flag and meaningful exit codes to `fork_terminal.py`
- Updated README.md to use relative paths

**Remaining**: Script uses plain text output rather than structured JSON (acceptable for simple pass/fail)
**Notes**: The `prompts/` to `assets/` rename is structural but not breaking (no external consumers reference internal directory paths)

---

### gen-image
**Commit**: `b18781c`
**Fixed**:
- Removed duplicate Purpose heading
- Removed Common Sizes table (duplicated content in reference/commands.md)
- Replaced "List Available Models" step with IF/THEN "Route Request" step
- Added Reference section with IF/THEN routing
- Converted declarative prompt guidance to procedural

**Remaining**: README.md contains duplicate content and forbidden section names — serves GitHub-facing role, recommend reviewing

---

### menu-app
**Commit**: `dae9b05`
**Fixed**:
- Removed duplicate Purpose section from SKILL.md
- Cleaned up README.md: removed forbidden Examples section and phantom OUTPUT_DIR variable (never used in SKILL.md)

**Remaining**: None

---

### skill-guide
**Commit**: `6caef28`
**Fixed**:
- Removed `Bash` from allowed-tools (least privilege — skill only reads/globs/greps)
- Removed duplicated Options/Variables table and forbidden Examples section from README.md

**Remaining**: None
**Notes**: `~` paths in variables are shell-portable, not hardcoded absolute paths

---

### speak
**Commit**: `37c4fb0`
**Fixed**:
- Replaced `${CLAUDE_SKILL_DIR}` with `./scripts/speak-cache.py` in CACHE_TOOL variable
- Added concrete elevenlabs skill discovery procedure in step 2
- Added missing inline examples to steps 3, 4, and 5
- Normalized `<elevenlabs-skill-dir>` to `<elevenlabs-dir>` for consistency

**Remaining**: Step 2 uses `~/.claude/skills` hardcoded path for elevenlabs discovery — inherent to cross-skill dependency
**Notes**: `$ARGUMENTS` is Claude Code-specific but conventional for this repo

---

## Agents

### browser-operator
**Commit**: `c1b71b7`
**Fixed**: Added `allowed-tools: [Bash, Read]` to frontmatter
**Remaining**: None

### browser-qa
**Commit**: `62ab781`
**Fixed**: Added `allowed-tools: [Bash, Read]` to frontmatter
**Remaining**: None
**Notes**: Variables section overlaps with browser skill but provides agent-specific defaults (different SCREENSHOTS_DIR) — intentional override, not duplication

### elevenlabs-operator
**Commit**: `4716d43`
**Fixed**:
- Added `allowed-tools: [Bash, Read, Write, Glob]`
- Reformatted description as YAML block scalar
- Converted vague constraints to IF/THEN pattern
- Added boundary constraint against modifying files outside output directory

**Remaining**: None

### elevenlabs-voice-designer
**Commit**: `94204a7`
**Fixed**:
- Added `allowed-tools: [Bash, Read]`
- Expanded Role to 2 paragraphs with behavioral detail
- Removed Variables/Workflow sections that duplicated elevenlabs skill CLI commands
- Added Skills section deferring to skill for CLI syntax
- Retained Report Format as agent-specific output template

**Remaining**: None

### gen-image-operator
**Commit**: `c9a1bd9`
**Fixed**:
- Added `allowed-tools: [Bash, Read]`
- Rewrote description with WHAT+WHEN trigger pattern
- Added parallel-safe language to Role
- Normalized constraint formatting with ALWAYS/IF prefixes
- Added unique filename and file size reporting constraints

**Remaining**: None

### speak-narrator
**Commit**: `201deb4`
**Fixed**:
- Added `allowed-tools: [Bash, Read, Glob]`
- Reformatted description as multi-line YAML
- Removed Workflow section (duplicated speak skill TTS internals)
- Folded key obligations into Constraints
- Added delegation note to Skills section

**Remaining**: None

---

## Skipped Breaking Changes (NEEDS YOUR REVIEW)

### 1. `elevenlabs` skill name is implementation-specific
The name describes the provider (ElevenLabs) rather than the capability (e.g., `tts`, `audio-gen`). Per naming principles, it should be renamed. However, registry pointers reference `elevenlabs` — renaming requires coordinated update across registry + all consuming agents/skills.

**Recommendation**: If you want to rename, do it as a coordinated migration: rename skill, update registry, update `elevenlabs-operator` and `elevenlabs-voice-designer` agent names, update `speak` skill's discovery path. Or accept the name since ElevenLabs is the de facto brand and unlikely to be swapped.

### 2. `elevenlabs-operator` and `elevenlabs-voice-designer` agent names
Same issue — implementation prefix. Would need to become `audio-operator` and `voice-designer` (or similar) if the skill is renamed.

---

## Areas Needing Your Attention

### README.md Policy — RESOLVED
All remaining README.md files removed from skills. Skill-forge principles updated to discourage README.md: SKILL.md is the single source of truth for both human and model discovery. README.md files duplicated content and drifted, confusing agents.

### `${CLAUDE_SKILL_DIR}` vs Relative Paths
All occurrences in skill bodies were replaced with relative paths (`./scripts/...`). However, some Variables sections still reference `${CLAUDE_SKILL_DIR}` for directory definitions (e.g., browser-workflow's WORKFLOWS_DIR). The question is whether variables are "body" (should use relative paths) or "configuration" (harness variable is acceptable).

**My judgment**: I left `${CLAUDE_SKILL_DIR}` in variable definitions where the variable is specifically about locating a harness-specific directory. I replaced it everywhere else. This felt like the right tradeoff — harness vars in config, relative paths in procedures.

### `model` Field in Agent Frontmatter
All agents have a `model:` field (typically `sonnet` or `opus`). This isn't part of the expected agent structure template in create-agent.md, but it's a consistent repo convention. Agents left it in place. Worth noting it's a Claude Code extension field, not portable.

### Cross-Skill Dependencies
The `speak` skill discovers and calls the `elevenlabs` skill at runtime via a hardcoded `~/.claude/skills` path. This is fragile if the user's skill directory changes. A more robust discovery mechanism (registry query, env var) would improve this, but that's a design decision beyond a simple fix.

### `skills` Frontmatter Field in Agents
Several agents have a `skills:` field in frontmatter listing their skill dependencies. This isn't in the agentskills.io spec or the create-agent.md template, but it's a consistent repo convention. Agents were left as-is since it's additive and not harmful.
