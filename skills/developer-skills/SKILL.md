---
name: developer-skills
description: "Use to implement Apex, LWC, Flows, Salesforce metadata, integrations, or React logic. Also handles explicitly requested LWC/React test authoring."
---

# Salesforce and React Development

1. Read the owned files and adjacent patterns. Reuse the supplied plan; for simple changes, do not write a second plan. Read only relevant files under `.agents/reference/` (or legacy `.codex/reference/` if missing). Apply canonical naming and exact Apex class/LWC JavaScript headers for new files. Apex method comments are opt-in.
2. Start with the repo and local checks. Load a relevant workspace Salesforce skill only when it resolves a concrete platform-mechanics gap (e.g., Flow XML or an API version difference). Use Salesforce DX or Context7 MCP only when requested or needed for a specific unavailable fact or authorized action; Context7 is for React docs, not Salesforce. Never deploy without explicit authorization and a known target.
3. For a new Apex class or LWC bundle, follow [local scaffolding](references/scaffolding.md). Prefer a short local generator command when its output is in scope, then edit the generated files with file-edit tools. If no suitable generator is available, create the required files directly with file-edit tools. Do not embed source in long shell commands.
4. Implement the owned behavior/structure. For Apex, handle bulk input, enforce sharing and CRUD/FLS, validate boundaries, avoid SOQL/DML in loops, and include required metadata. For React/LWC, follow project state, lifecycle, and error-handling patterns. Read [development patterns](references/patterns.md) for React details or Salesforce design examples as needed.
5. Run the smallest relevant checks. Do not create or change test artifacts without explicit scope, including generated scaffolds, fixtures, and test-only dependencies. Explicit LWC/React test authoring uses the existing framework and project conventions; Apex authoring belongs to `apex-test`. Report checks run and any unverified work.
