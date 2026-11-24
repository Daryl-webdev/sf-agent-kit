---
name: ui-developer
description: "Use for Salesforce SLDS or React visual work: CSS, layouts, mockups, themes, responsiveness, design tokens, and presentation accessibility."
---

# UI Development

1. Inspect the affected markup, styles, project tokens, and existing layouts. Read relevant project references under `.agents/reference/` (or legacy `.codex/reference/` if missing). Keep one owner per file and don't change business logic.
2. For a small fix, match the existing design. For a larger visual change, define layout, breakpoints, tokens, and component states. Prefer project conventions, semantic markup, logical CSS properties, and existing SLDS utilities/hooks or React styles.
3. Use a workspace design-system skill only for a concrete Salesforce mechanics gap. Use ui-ux-pro MCP only for React UI if requested or a specific design requirement cannot be resolved locally; never use it for SLDS. Read [design examples and tool selection](references/design.md) only when needed.
4. Check in-scope contrast, keyboard focus, accessible names, reduced motion, responsiveness, and visual states. Don't add test artifacts or deploy. Report what was inspected and what still needs rendered verification.
