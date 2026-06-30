# Project / Org Context

Fill this in with your org's facts. Agents read it to ground every plan and all generated code. Replace every `TODO`. The more accurate this is, the more deterministic and correct the output.

## Org & package

- API version (`<API_VERSION>`): `66.0`
- Package/namespace prefix (`<PREFIX>`): TODO (blank if unmanaged)
- Source format root: `force-app/main/default`
- Primary org type: TODO (production / sandbox / scratch)

## Naming prefixes

These fully control prefixing. coding-standards.md reads them generically, so you **never edit that file** when adding or changing a prefix — just edit the rows below.

**Apply to all** (optional): TODO — default prefix for any artifact without a specific rule below. Leave blank for no global prefix.

**Specific prefixes** (optional; override apply-to-all; add or remove rows freely):

| Artifact | Prefix | Example |
|----------|--------|---------|
| Apex (classes & triggers) | `ABC_` | `ABC_InvoiceService`, `ABC_AccountTrigger` |
| LWC | `abc` | `abcInvoiceList` |
| Custom object/field | `ABC_` | `ABC_Invoice__c` |

Precedence for each artifact: **specific row → apply-to-all → none**.

## Integrations

| System | Mechanism | Auth | Notes |
|--------|-----------|------|-------|
| TODO | Named Credential / Platform Event / API | TODO | TODO |

## Project layout

- Apex classes:  `force-app/main/default/classes`
- LWC: `force-app/main/default/lwc`
- Triggers: `force-app/main/default/triggers`
- Tests: co-located vs separate

## Conventions specific to this org

- TODO: anything not covered by coding-standards.md that code must follow.
