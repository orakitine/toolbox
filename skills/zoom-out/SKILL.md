---
name: zoom-out
description: >-
  Pulls the agent up a layer of abstraction and maps the relevant modules
  and callers around the code in focus, using the project's domain glossary
  vocabulary. Use when you're unfamiliar with a section of code or invoke
  "zoom out" or `/zoom-out`.
disable-model-invocation: true
---

# Purpose

Counter tunnel-vision when working inside a single file or function. Instead of drilling deeper, go up a layer and survey the surrounding code, labeling it with the project's own domain vocabulary so the picture is anchored in real concepts rather than generic CS terms.

## Workflow

1. **Zoom Out**
   - Stop drilling into the current code and go up a layer of abstraction
   - Produce a map of the relevant modules and callers around the code in focus
   - Example: from a single function, widen to the surrounding file, its callers, and what it depends on

2. **Use the Project's Domain Glossary**
   - Label the map with the project's own vocabulary, not generic terms
   - If the project has a glossary, use the words it defines verbatim
   - Example: if the project's terms are `Tenant` and `Ledger`, the map uses those words rather than "customer" or "database"
