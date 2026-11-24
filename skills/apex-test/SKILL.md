---
name: apex-test
description: "Use only to explicitly create or update Apex tests for classes, triggers, controllers, or async jobs. Not for run-only or coverage measurement."
---

# Apex Test Authoring

1. Confirm Apex test edits are explicitly in scope. Do not edit production code. For run-only, use the existing Apex runner instead of this skill.
2. Inspect the target class, its dependencies, and nearby tests. Read `project-context.md` and `coding-standards.md` from `.agents/reference/` (or legacy `.codex/reference/` if missing). Use the configured per-source-class coverage target or an explicit user override; default to 85% and disclose missing configuration.
3. Select applicable positive, negative, bulk, permission, exception, and boundary cases. Use existing test factories or `@TestSetup`, isolated data, descriptive `Assert` assertions, and `Test.startTest()` / `Test.stopTest()` as appropriate. Use the exact Apex class header; add method comments only when requested. For async, callout, trigger, or controller examples, read [test patterns](references/patterns.md).
4. Validate locally first. Use a matching local Salesforce skill only for a concrete platform-mechanics gap. Discover/use MCP only if requested or a required fact or authorized action is unavailable locally. Deploy only with explicit authorization and a known target. Run org tests only when requested or authorized for verification; don't deploy to obtain coverage without separate authorization.
5. Report changed test files, completed checks, and measured coverage against the target. If the new version could not be run, say coverage is unverified; don't estimate it as verified.
