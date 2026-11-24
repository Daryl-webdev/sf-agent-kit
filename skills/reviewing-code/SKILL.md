---
name: reviewing-code
description: "Use for read-only Salesforce or React code review: correctness, security, governor limits, performance, standards, and test gaps. Reports findings without fixing them."
---

# Read-Only Code Review

1. Inspect the requested files or diff and identify the intended behavior. Read only relevant project standards from `.agents/reference/` (or legacy `.codex/reference/` if missing). Do not edit, deploy, or contact other agents. Note uncovered tests without authoring them.
2. Check correctness, failure paths, data/access boundaries, applicable Salesforce limits, and regressions. Use the [extended checklist](references/checklist.md) for applicable platform, integration, API, test, or deployment risks. Prefer existing local checks when useful. Discover/use MCP only when requested or a particular required check cannot be completed locally; do not automatically run analyzers.
3. Every finding must include `severity`, `domain`, `file:line`, the expected behavior, impact, and a proposed correction. Use the smallest severity justified by the evidence:

| Severity | Meaning |
|---|---|
| Blocker | Breaks critical behavior, risks data loss, or exposes a serious security hole |
| Critical | Significant security/governor-limit risk |
| Major | Material logic, error-handling, or bulk behavior defect |
| Minor | Localized quality, style, or maintainability issue |
| Nitpick | Cosmetic preference |

Tag implementation issues by domain (`apex`, `lwc-js`, `react`, `security`, `metadata`, `integration`, `api-contract`, `observability`, `deployment`, `compat`); visual issues as `ui-css`, `slds`, or `a11y`; test issues as `apex-test` or `web-test` according to the affected test artifacts. Findings do not grant permission to edit.

Return reviewed scope, findings with severity counts, verification gaps, and a verdict. **PASS** means no Blocker/Critical/Major; otherwise report **CHANGES REQUESTED**. Grade A for PASS with up to two Minor findings, B for PASS with more, C for CHANGES REQUESTED. For review-only, omit handoff instructions. For an authorized revision loop, return the tags so the orchestrator can route fixes; never route them yourself.
