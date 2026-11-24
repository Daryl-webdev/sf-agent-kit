# Development Patterns

Use only the conventions and examples applicable to the change. Project conventions take precedence.

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
