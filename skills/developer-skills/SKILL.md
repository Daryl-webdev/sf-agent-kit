---
name: developer-skills
description: 'Code dev workflow for Salesforce + React (Apex, LWC, triggers, Flows, React). Uses Context7 for React docs.'
argument-hint: 'Describe the coding task (e.g., "create an Apex controller for invoice processing")'
---

# Developer Skills

Full multi-step workflow for Salesforce and React code development. Uses Context7 MCP for React documentation lookup.

## When to Use

- Writing or modifying Apex classes, triggers, or test classes
- Creating or updating Lightning Web Components (LWC)
- Building or editing Flows
- Implementing integrations or API callouts
- Building React components or hooks
- Any Salesforce or React code-related development task

## Workflow

### Step 1: Understand the Requirement

1. Identify the type of work:
   - **Apex**: Class, Trigger, Test Class, Batch, Queueable, Schedulable
   - **LWC**: Component, Service, Wire Adapter usage
   - **Flow**: Screen Flow, Record-Triggered, Autolaunched, Scheduled
   - **Configuration**: Objects, Fields, Permission Sets, Layouts
2. Clarify inputs, outputs, and acceptance criteria
3. Identify related existing code in the workspace

### Step 2: Research via Context7 MCP

Before writing code, use Context7 MCP to look up:
- Current Salesforce API documentation for relevant features
- Best practices and governor limits for the approach
- Syntax and patterns for the specific metadata type

### Step 3: Plan the Implementation

1. List files to create or modify
2. Identify dependencies (objects, fields, permissions)
3. Determine test strategy:
   - Positive and negative test cases
   - Bulk data scenarios (200+ records)
   - Required assertions

### Step 4: Implement

Follow these conventions:
- **Apex**: One class per file, proper exception handling, bulkified patterns, no SOQL/DML in loops
- **LWC**: Reactive properties, proper lifecycle hooks, error handling in wire/imperative calls
- **Triggers**: Handler pattern (trigger delegates to handler class), one trigger per object
- **Tests**: Minimum 85% coverage, meaningful assertions, `@TestSetup` for data creation

### Step 5: Validate

1. Check for governor limit violations (SOQL in loops, DML in loops, hardcoded IDs)
2. Verify security: CRUD/FLS checks, no SOQL injection, proper sharing keywords (`with sharing`/`without sharing`)
3. Ensure test coverage meets requirements
4. Confirm metadata XML files are present and correct

## Quality Checklist

- [ ] No SOQL or DML inside loops
- [ ] Bulkified for 200+ records
- [ ] Proper error handling with try/catch
- [ ] `with sharing` keyword used unless explicitly needed otherwise
- [ ] CRUD/FLS enforced (Security.stripInaccessible or WITH SECURITY_ENFORCED)
- [ ] No hardcoded record IDs or org-specific values
- [ ] Tests delegated to `apex-test` skill (do not author tests here)
- [ ] All metadata XML files included (`-meta.xml`)
- [ ] Naming conventions followed (PascalCase for classes, camelCase for methods/variables)

## Context7 MCP Integration

**Only invoke Context7 when the task involves React code.**

When working on React tasks:
1. Query Context7 MCP to resolve the relevant React library documentation
2. Use the returned docs for hooks, component patterns, and API references
3. Validate approach against current React best practices

Do NOT invoke Context7 for Salesforce/Apex/LWC tasks.

## React Development

### Conventions

- Functional components with hooks (no class components)
- Proper state management (useState, useReducer, context)
- useEffect cleanup for subscriptions and event listeners
- Memoization (useMemo, useCallback) only when needed for performance
- Error boundaries for resilient UIs
- TypeScript preferred when the project uses it

### Quality Checklist (React)

- [ ] No direct DOM manipulation — use refs only when necessary
- [ ] Effects have proper dependency arrays
- [ ] Effects clean up subscriptions/timers
- [ ] Keys used correctly in lists (no index keys for dynamic lists)
- [ ] Accessible markup (semantic HTML, ARIA where needed)
- [ ] No prop drilling beyond 2 levels — use context or composition

## Common Patterns

### Apex Controller for LWC

```
Controller class → @AuraEnabled methods → LWC JS imports → LWC HTML template
```

### Trigger Framework

```
Trigger (thin) → Handler class → Service/Utility classes → Test class
```

### Flow + Apex Hybrid

```
Flow (orchestration) → Invocable Apex (@InvocableMethod) → Helper classes → Test class
```
