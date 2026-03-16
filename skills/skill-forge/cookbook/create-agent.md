# Create an Agent

Step-by-step workflow for creating a Claude Code agent definition. Assumes PRINCIPLES.md is already loaded (SKILL.md Step 2).

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
   - Apply description rules from Principles (see "Description: The 100-Token Pitch")
   - Focus on the ROLE, not just the tools
   - Example: "UI validation agent that executes user stories against web apps and reports pass/fail results with screenshots at every step."
   - Bad example: "Agent that uses Playwright"

4. **Define Allowed Tools**
   - Apply allowed-tools rules from Principles (see "Allowed-Tools Selection")
   - Agents get their own permissions, separate from the skill they serve
   - Example: browser-qa → `Read`, `Glob`, `Bash` (no Write — QA doesn't modify)

5. **Write the Agent Definition**
   - Structure:
     ```markdown
     ---
     name: agent-name
     description: What role this agent plays, third person, WHAT + WHEN
     allowed-tools:
       - Tool1
       - Tool2
     ---

     # Role

     [1-2 paragraphs: what this agent does, how it behaves, its persona]

     ## Constraints

     [Boundaries and safety rails — what the agent must NOT do]
     [Quality standards — what the agent must ALWAYS do]

     ## Skills

     [Which skills this agent has access to or should invoke]
     [How it uses them in context]
     ```
   - Example:
     ```markdown
     ---
     name: browser-qa
     description: >-
       UI validation agent that executes user stories against web apps
       and reports pass/fail with screenshots. Use for QA, acceptance
       testing, and UI verification.
     allowed-tools:
       - Read
       - Glob
       - Bash
     ---

     # Role

     You are a QA tester. Given a user story and a URL, you
     systematically validate each acceptance criterion against the
     live application. You take screenshots at every step and report
     pass/fail results with evidence.

     ## Constraints

     - NEVER modify application code or data
     - ALWAYS take a screenshot before and after each action
     - Report ALL failures, don't stop at the first one
     - If a step is ambiguous, flag it rather than guessing

     ## Skills

     - Uses the `browser` skill for all browser automation
     - Follows browser skill's workflow for page interaction
     ```

6. **Wire Up Composition (if applicable)**
   - IF: this agent is used by a skill → update the skill's frontmatter:
     ```yaml
     context: fork
     agent: browser-qa
     ```
   - IF: this agent is standalone → no wiring needed
   - Example: browser skill's SKILL.md gets `context: fork` + `agent: browser-qa`

7. **Validate the Agent**
   - Check against principles:
     - [ ] Name follows `<capability>-<role>` pattern
     - [ ] Name prefix matches related skill family
     - [ ] Description is third-person, specific, includes trigger words
     - [ ] Role section clearly defines persona and behavior
     - [ ] Constraints are specific and actionable (not vague "be careful")
     - [ ] Allowed-tools follows least privilege
     - [ ] Composition wiring is correct (if applicable)

## Error Handling

- IF: agent role overlaps with existing agent → suggest merging or clarifying the distinction
- IF: agent has no related skill → confirm this is intentional (standalone agents are valid but rare)
- IF: constraints are too vague → ask for specific scenarios and failure modes
