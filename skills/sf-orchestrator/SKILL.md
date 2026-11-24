---
name: sf-orchestrator
description: "Use to route Salesforce or React work: plan features, implement Apex/LWC/Flow or UI, review existing changes, run existing tests, or explicitly author tests. Applies one domain skill per work item without subagents."
---

# Salesforce Orchestrator (Codex)

Read [the shared routing policy](references/routing.md) before choosing an intent and domain. If the policy is missing, report the incomplete install and stop the kit workflow.

| Policy route | Execution |
|---|---|
| `plan` or `run-existing-tests` | Follow the policy inline; no authoring skill |
| `review` | Apply `reviewing-code` inline |
| `develop` or `author-web-tests` | Apply `developer-skills` inline |
| `style` | Apply `ui-developer` inline |
| `author-apex-tests` | Apply `apex-test` inline |

Use installed skill discovery. If a required skill is not discoverable, report it instead of inventing its workflow. Never spawn a subagent. For mixed work, load only the skill needed for the current item and reuse confirmed context. Call review of your own changes a **self-check**, not an independent review. Summarize changes, verification, and blockers.
