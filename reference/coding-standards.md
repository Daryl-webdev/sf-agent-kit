# Coding Standards (canonical)

Only the **opinionated / org-specific** conventions to enforce — the deviations from defaults and the exact shapes that keep output consistent. Generic platform rules (no SOQL/DML in loops, CRUD/FLS, bind variables, no hardcoded IDs) are enforced by the `reviewing-code` skill and are **not** repeated here. Replace `<PREFIX>` / `<API_VERSION>` from [project-context.md](project-context.md).

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
| Custom object/field | `<PREFIX>_Name__c` | `<PREFIX>_Invoice__c` |

LWC folders camelCase; constants UPPER_SNAKE_CASE.

## Architecture (enforce)

- **Layered:** Trigger → TriggerHandler → Service → Selector. Controllers and handlers hold no SOQL/DML — go through Service/Selector.
- One trigger per object; thin body that only delegates to its handler.
- Selectors own all SOQL. One top-level class per file; every file ships its `-meta.xml`.

## Conventions (opinionated)

- Default `with sharing`; `inherited sharing` for reusable libraries; document any `without sharing`.
- Each domain defines a `<Domain>Exception`; `@AuraEnabled` methods translate failures to `AuraHandledException` with a user-safe message.
- New metadata targets API version `<API_VERSION>`.
