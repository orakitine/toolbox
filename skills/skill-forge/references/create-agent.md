# Create an Agent (Claude Code)

> **Harness-specific:** This workflow is for Claude Code's agent system (`.claude/agents/`). Other harnesses may implement agent/persona concepts differently. The universal skill format does not include agents — they are a Claude Code orchestration feature.

Step-by-step workflow for creating a Claude Code agent definition. Assumes PRINCIPLES.md and `./claude-code.md` are already loaded.

## Workflow

1. **Gather Requirements**
   - Determine:
     - What role does this agent play? (QA tester, code reviewer, voice designer)
     - What skills does it use or enhance?
     - What constraints or behavioral rules does it need?
     - What tools does it need access to?
   - Example: "An agent that validates user stories against a web app" → role: QA tester, uses browser skill, constrained to read-only validation, needs browser tools

2. **Choose a Name**
   - Pattern: `<capability>-<role>`
   - The capability prefix should match the related skill's name for family discoverability
   - Example: skill is `browser` → agent is `browser-qa` or `browser-automation`
   - Example: skill is `elevenlabs` → agent is `elevenlabs-voice-designer`
   - Validate: does searching by prefix find this agent alongside its skill?

3. **Write the Description**
   - Apply description rules from Principles
   - Hybrid voice: third-person WHAT + imperative WHEN
   - Focus on the ROLE, not just the tools
   - Example: "UI validation agent that executes user stories against web apps and reports pass/fail results with screenshots. Use for QA and acceptance testing."
   - Bad example: "Agent that uses Playwright"

4. **Define Allowed Tools**
   - Apply least privilege principle
   - Agents get their own permissions, separate from the skill they serve
   - Example: browser-qa → `Read`, `Glob`, `Bash` (no Write — QA doesn't modify)

5. **Choose a Color**
   - See color conventions in `./claude-code.md`
   - Match color to role type for at-a-glance recognition
   - Example: QA agent → `green`, operator → `orange`, reviewer → `purple`

6. **Write the Agent Definition**
   - Create file at `.claude/agents/<name>.md`
   - Structure:
     ```markdown
     ---
     name: agent-name
     description: >-
       What role this agent plays, WHAT + WHEN.
     allowed-tools:
       - Tool1
       - Tool2
     color: green
     ---

     # Role

     [1-2 paragraphs: what this agent does, how it behaves]

     ## Constraints

     [Boundaries and safety rails — what the agent must NOT do]
     [Quality standards — what the agent must ALWAYS do]

     ## Skills

     [Which skills this agent uses and how]
     ```

7. **Wire Up Composition (if applicable)**
   - IF: this agent is used by a skill → update the skill's frontmatter:
     ```yaml
     context: fork
     agent: agent-name
     ```
   - IF: this agent is standalone → no wiring needed

8. **Validate the Agent**
   - Check against principles:
     - [ ] Name follows `<capability>-<role>` pattern
     - [ ] Name prefix matches related skill family
     - [ ] Description is specific, includes trigger words
     - [ ] Role section clearly defines persona and behavior
     - [ ] Constraints are specific and actionable (not vague "be careful")
     - [ ] Allowed-tools follows least privilege
     - [ ] Color matches role convention
     - [ ] Composition wiring is correct (if applicable)

## Error Handling

- IF: agent role overlaps with existing agent → suggest merging or clarifying the distinction
- IF: agent has no related skill → confirm this is intentional (standalone agents are valid but rare)
- IF: constraints are too vague → ask for specific scenarios and failure modes
