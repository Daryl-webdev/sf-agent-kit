# Coding Standards (canonical)

Only the **opinionated / org-specific** conventions to enforce — the deviations from defaults and the exact shapes that keep output consistent. Generic platform rules (no SOQL/DML in loops, CRUD/FLS, bind variables, no hardcoded IDs) are enforced by the `reviewing-code` skill and are **not** repeated here. All name prefixes and `<API_VERSION>` come from [project-context.md](project-context.md) — see its **Naming prefixes** section.

## Naming (enforce exactly)

| Artifact | Convention | Example |
|----------|-----------|---------|
| Controller (LWC/Aura) | `<Domain>Controller` | `InvoiceController` |
| Service (business logic) | `<Domain>Service` | `InvoiceService` |
| Selector (all SOQL) | `<Object>Selector` | `AccountSelector` |
| Trigger (one per object) | `<Object>Trigger` | `AccountTrigger` |
| Trigger handler | `<Object>TriggerHandler` | `AccountTriggerHandler` |
| Async | `<Domain>Batch` / `Queueable` / `Schedule` | `InvoiceSyncBatch` |
| Custom exception | `<Domain>Exception` | `InvoiceException` |
| Test class / method | `<ClassName>Test` / `test<Method>_<scenario>` | `InvoiceServiceTest` |
| Custom object/field | `<prefix><Name>__c` | `ABC_Invoice__c` |

### Name prefixing

Prefixes are controlled **entirely** by project-context.md — never edit this file to add or change one. Apply the table above's name shapes, then resolve the prefix for each artifact in this order:

1. If project-context.md lists a **specific** prefix for that artifact type, use it (exact string, including case and separator).
2. Else if an **apply-to-all** prefix is set, use it.
3. Else omit the prefix (unmanaged / no namespace).

Adding a new artifact prefix (e.g. a trigger- or batch-specific one) is a single edit in project-context.md; this file needs no change.

LWC folders camelCase; constants UPPER_SNAKE_CASE.

## Architecture (enforce)

- **Layered:** Trigger → TriggerHandler → Service → Selector. Controllers and handlers hold no SOQL/DML — go through Service/Selector.
- One trigger per object; thin body that only delegates to its handler.
- Selectors own all SOQL. One top-level class per file; every file ships its `-meta.xml`.

## Conventions (opinionated)

- Default `with sharing`; `inherited sharing` for reusable libraries; document any `without sharing`.
- Each domain defines a `<Domain>Exception`; `@AuraEnabled` methods translate failures to `AuraHandledException` with a user-safe message.
- New metadata targets API version `<API_VERSION>`.
