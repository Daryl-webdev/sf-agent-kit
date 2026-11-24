# Shared Salesforce Routing Policy

## 1. Classify intent before domain

| User intent | Route and boundary |
|---|---|
| Plan, plan-only, design options | `plan`: inspect in scope and return the requested plan without implementation or org writes. |
| Review, audit, critique | `review`: inspect existing files/diff, report findings, and stop. Do not generate code, apply fixes, or dispatch a revision. |
| Review and fix | `review` existing work first, then revise only authorized findings. |
| Implement or fix | `develop` for behavior, Apex, Flow, metadata, LWC/React logic; `style` for visual work, CSS, SLDS, themes, and layout. |
| Run existing tests, check existing coverage | `run-existing-tests`: use the existing project runner for LWC/React or the scoped Apex runner against the intended org. Never author tests or deploy. |
| Explicitly author or update tests | `author-apex-tests` for Apex; `author-web-tests` for LWC/React. Include ordinary implementation only if separately in scope. |

Classify each requested action separately. A bare coverage request is measurement, not permission to write tests; ask only if the action or target cannot be inferred safely. For `run-existing-tests`, confirm test selection and org from the request or workspace. If the selected tests are not deployed or the runner is unavailable, report the blocker instead of deploying, scaffolding, or broadening the run. Report the target, selection, results, and measured coverage when available.

## 2. Gate writes and external tools

- Start with workspace files, project references, and local checks. Discover/call MCP only if explicitly requested or needed for a specific fact or authorized action unavailable locally. Use a scoped existing command or tool; complexity or a skill example alone is not a reason to call MCP. If a required capability is unavailable, report the gap.
- Never deploy without explicit authorization and a known target. Test authoring, test running, a review finding, or a validation step does not authorize deployment. Do not perform other org writes outside the user's scope.
- Authoring or modifying any test artifact requires explicit scope, including mocks, fixtures, snapshots, test components, and test-only config/dependencies. Avoid scaffolds that silently generate them. A test failure or review finding does not expand scope.
- Use canonical project coding standards for exact new Apex class/LWC JavaScript headers, including test Apex classes. Add Apex method comments only if requested. Obtain the per-source-class Apex coverage target from project context (default 85% if missing); report unmeasured coverage as unverified.

## 3. Choose the shortest safe workflow

- **Simple:** one owner, targeted reads and verification. No full plan, broad metadata inventory, separate design check, or automatic review loop. Give a brief plan when the user asks for one.
- **Complex:** cross-component contracts, data/sharing changes, async/integrations, or similar risk. The orchestrator owns one plan using `planning-template.md`; inventory relevant workspace metadata first and resolve only material live gaps. Check platform limits, bulk behavior, sharing/CRUD/FLS, and order of execution as applicable. Ask about material blockers; state harmless assumptions. Reuse the plan; don't ask specialists to repeat it.
- Load only the relevant project reference files from `.agents/reference/` (or legacy `.codex/reference/` if the file is absent; use `reference/` when working on the kit). Use `project-context.md` for required org facts, `coding-standards.md` for relevant generation/review, and the template only for complex plans. Do not search all local skills by default. Load one matching workspace Salesforce skill only to answer a concrete mechanics gap.
- Skill/reference guidance defines workflow and conventions; local Salesforce skills supply platform mechanics only. Neither overrides the user's scope or the authorization rules above.
- Order work by dependencies, not by role. One writer per file; run only independent, disjoint writes concurrently where the host supports it. Share any necessary contract before dependent work.

## 4. Review and revise only within scope

Use the relevant checklist on scoped files. A requested review without a fix stays read-only. For an authorized review-and-fix or a risk-based check of implementation already in scope, route only Blocking severities (Blocker/Critical/Major). Route logic/security/metadata/integration to `develop`, visual/SLDS/presentation accessibility to `style`, and test changes to the matching authoring route only if explicitly in scope. Report other findings and out-of-scope fixes. Recheck revised files, stop after at most two revision passes, and report remaining blockers. Do not rerun work already verified unless it changed.
