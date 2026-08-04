---
name: reviewing-code
description: 'Review Salesforce + React code (quality, security, governor limits, perf, tests). Scored, severity-tagged findings; flags only.'
argument-hint: 'Name or path of the file(s) to review (e.g., "ServiceInvoiceUploadController.cls")'
---

# Code Reviewer

Structured workflow for reviewing Salesforce and React code. Produces objective, severity-tagged, routable findings. **Flags issues — never rewrites code.**

## Local sf-skill augmentation

Before starting, list the workspace `.agents/skills/` and pick any local sf-skill whose folder name/description matches the review scope (e.g. `dx-code-analyzer-run`, `mobile-platform-offline-validate`, `design-systems-slds-validate`). sf-skills are renamed often — match by domain-first prefix (`dx-*`, `platform-*`, `design-systems-*`, `mobile-*`), not exact names. If one matches, read its `SKILL.md` and follow it **together with** this workflow — sf-skills supply current platform mechanics; they do not replace these steps.

**Conflict rule:** this skill and the reference library win on workflow, checklist, severity model, and output format. Local sf-skills win only on platform mechanics — current tool syntax, CLI commands, and analyzer rules.

## Reference library (read first)

Review against the project reference library as the source of truth (in your project at `.agents/reference/` for Copilot or `.codex/reference/` for Codex):
- `reference/coding-standards.md` — the exact naming, structure, error-handling, and sharing rules to check against
- `reference/project-context.md` — org data model, prefixes, and integrations to validate references against

Flag deviations from these as findings. Precedence: this skill + reference library, then local sf-skills (platform mechanics only).

## When to Use

- Reviewing an Apex class, trigger, LWC, service, or React component
- PR / pre-merge / pre-deploy code review
- Auditing code quality, security, or governor-limit safety

## Salesforce DX MCP Tools

| Tool | Purpose |
|------|---------|
| `run_code_analyzer` | Static analysis (security, performance, best practices, style) |
| `query_code_analyzer_results` | Filter/explain analyzer findings by severity, engine, category |
| `scan_apex_class_for_antipatterns` | Apex performance & governor-limit antipatterns |
| `describe_code_analyzer_rule` | Explain what a flagged rule means |
| `run_soql_query` | Verify object/field references during review |

## Workflow

### Step 1: Establish Scope & Intent

1. Read the file(s) in scope.
2. Identify the requirement/ticket the code is meant to satisfy (if provided).
3. Identify the code type: Apex (Controller/Service/Trigger/Batch/Queueable), LWC (JS/HTML/CSS), Flow, or React.

### Step 2: Run Objective Tooling

- Apex → `scan_apex_class_for_antipatterns`, then `run_code_analyzer`.
- LWC/JS → `run_code_analyzer` (ESLint engine).
- Review results with `query_code_analyzer_results`; explain unclear rules with `describe_code_analyzer_rule`.

### Step 3: Apply the Review Checklist

**1. Correctness & Logic**
- Meets the requirement; handles nulls, empty collections, boundaries, negative paths.
- No off-by-one, wrong operators, or incorrect conditionals.

**2. Security (OWASP + Salesforce)**
- Apex: no SOQL/SOSL injection; enforces CRUD/FLS (`WITH USER_MODE` / `Security.stripInaccessible`); correct sharing keyword (`with sharing`).
- LWC/React: no XSS, unsafe `innerHTML`, or hardcoded secrets/credentials.
- Input validated at boundaries.

**3. Governor Limits & Performance (Apex)**
- No SOQL/DML inside loops (bulkified).
- Selective, indexed, `LIMIT`-ed queries.
- Async (Batch/Queueable/Future) used where appropriate.
- Heap/CPU/query-row usage within limits.

**4. Maintainability & Design**
- Separation of concerns (handler → service → selector).
- Single responsibility; no god classes/methods.
- DRY — no copy-paste duplication.
- Clear naming; no dead/commented-out code.
- No over-engineering / premature abstraction.

**5. Error Handling**
- Meaningful exceptions; no silent `catch {}`.
- No leaking stack traces / PII to users.
- Rollback / `Database.Savepoint` where needed.

**6. Testing**
- Adequate coverage with real assertions (not just execution).
- Positive + negative + bulk (200+) scenarios.
- `@TestSetup`, `Test.startTest/stopTest`, no `SeeAllData=true`.

**7. Standards & Style**
- Conforms to project lint config and naming conventions.
- SLDS / accessibility for UI (semantic HTML, ARIA, keyboard nav).

**8. Documentation & Readability**
- Self-documenting; comments explain *why*, not *what*.

**9. Integration Behavior** (callouts / external systems)
- Auth assumptions explicit (Named Credential, token refresh) — no hardcoded endpoints/keys.
- Request/response contract validated; handles non-200 status codes.
- Retries / backoff for transient failures; **idempotency** for repeatable calls.
- Timeout configured; graceful error behavior on failure (no silent swallow).

**10. API Contract** (`@RestResource`, `@AuraEnabled`, public interfaces)
- Required input fields validated; documented response fields.
- No internal Salesforce IDs leaked unless intended.
- Stable, versioned error messages and status codes; no breaking shape changes.

**11. Observability**
- Useful logging at decision/failure points; correlation/transaction IDs where needed.
- Errors sanitized (no PII/secrets in logs or responses).
- Enough context captured to troubleshoot a production issue.

**12. Backward Compatibility**
- Won't break existing callers, automations (Flows/triggers), or metadata references.
- Serialized/JSON response contracts unchanged (or versioned).
- Existing tests still valid; no signature changes to public/global members without review.

**13. Deployment Risk**
- All dependencies present (referenced classes, fields, objects, metadata).
- Required permission sets / profile / class & FLS access included.
- Feature flags / custom settings / custom metadata config accounted for.
- Deployment order and post-deploy steps noted.

### Step 4: Assign Severity & Routing Domain

| Severity | Meaning | Blocks? |
|----------|---------|---------|
| **Blocker** | Breaks functionality, data loss, security hole | Yes |
| **Critical** | Governor-limit risk, injection, missing FLS/CRUD/sharing | Yes |
| **Major** | Logic bug, missing error handling, poor bulkification | Yes |
| **Minor** | Style, naming, small duplication | No |
| **Nitpick** | Cosmetic, preference | No |

| Domain | Routes to |
|--------|-----------|
| `apex`, `lwc-js`, `security`, `metadata`, `integration`, `api-contract`, `observability`, `deployment`, `compat` | Developer |
| `ui-css`, `slds`, `a11y` | UI-Developer |
| `test` | Apex-Tester |

### Step 5: Score & Report

Compute a quality grade from findings:

| Grade | Condition |
|-------|-----------|
| **A — Ship it** | 0 Blocker/Critical/Major; ≤2 Minor |
| **B — Minor fixes** | 0 Blocker/Critical; ≤2 Major |
| **C — Changes requested** | Any Blocker/Critical, or >2 Major |

Output format depends on how the review was requested. Every finding must include **Why** — the expectation/standard it violates and the impact if not revised.

**Direct request (user asked for a review) — report only, no routing/handoff:**

```
## Code Review Report
- Files reviewed: <list>
- Grade: <A | B | C>
- Verdict: <PASS | CHANGES REQUESTED>
- Blockers: <n> | Critical: <n> | Major: <n> | Minor: <n> | Nitpick: <n>

## Findings (for revision)
1. [SEVERITY][domain] <file>:<line> — <problem>
   Why: <expectation/standard violated + impact if not revised>
   Suggested fix: <concrete suggestion>
2. ...

## Verdict
<PASS> or <CHANGES REQUESTED — the above should be revised>
```

In direct mode the report is the deliverable: **do not add a Routing section and do not hand findings to any other agent.**

**Orchestrated request (spawned by SF-Agent) — report + routing:**

```
## Review Summary
- Files reviewed: <list>
- Grade: <A | B | C>
- Verdict: <PASS | CHANGES REQUESTED>
- Blockers: <n> | Critical: <n> | Major: <n> | Minor: <n> | Nitpick: <n>

## Findings
1. [SEVERITY][domain] <file>:<line> — <problem>
   Why: <expectation/standard violated + impact if not revised>
   Suggested fix: <concrete suggestion>
2. ...

## Routing
- Developer: <finding #s>
- UI-Developer: <finding #s>
- Apex-Tester: <finding #s>
```

## Critical Rules

- **Flag only — never rewrite or edit code.** Read-only in every mode. The owning specialist applies fixes.
- **Direct (user) request — report only.** Produce the findings report as the deliverable; do NOT route, hand off, or call any other agent. The user decides next steps.
- **Orchestrated request — include routing** so the orchestrator can dispatch fixes; still never call agents yourself.
- Every finding must state **why** it was flagged (expectation violated + impact), not just what is wrong.
- Prefer tool-backed findings over opinion.
- Tag every finding with severity + domain.
- Only Blocker/Critical/Major trigger a revision cycle; Minor/Nitpick are reported but do not block.
