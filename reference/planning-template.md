# Planning Template (fill before coding)

The orchestrator and Developer fill this exact structure before writing any code, so planning is consistent every prompt. Keep it concise — a few bullet points per section.

```md
## Plan: <task title>

### 1. Objective
- What outcome is required, in one or two sentences.

### 2. Inputs & outputs
- Inputs: <records, params, user actions, external data>
- Outputs: <records created/updated, UI shown, response returned>
- Acceptance criteria: <bullet list of conditions that mean "done">

### 3. Affected metadata
- Apex: <classes/triggers to add or change>
- LWC: <components>
- Objects/fields: <existing or new, with -meta.xml>
- Permissions: <perm sets / FLS / profiles>

### 4. Approach
- Layering: which Controller / Service / Selector / Handler are involved.
- Key logic and data flow, following the naming/architecture in coding-standards.md.
- Reuse: existing classes/components to extend instead of duplicating.

### 5. Risks & governor limits
- Bulk safety (200+ records), SOQL/DML in loops, heap/CPU, callout limits.
- Security: CRUD/FLS, sharing, injection-safe SOQL.

### 6. Test strategy
- Positive / negative / bulk scenarios to cover (delegate authoring to apex-test).

### 7. Steps
1. <ordered, checkable implementation steps>
2. ...
```

## Rules
- Confirm the plan against [project-context.md](project-context.md) (objects, prefixes, integrations) before coding.
- For **complex** features (multiple objects/components, data-model or sharing changes, async/integration, multi-story), ground section 3 in a quick metadata inventory (research) and validate section 5 against platform limits (design check) before coding. **Skip both for simple tasks** to save cost.
- If any acceptance criterion or input is unknown, ask before generating code.
- For trivial single-file changes, a 3-line plan (Objective, Approach, Test) is enough — do not pad.
