# Extended Review Checklist

Use only the sections relevant to the changed code.

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
