# Reference Library

Canonical, project-specific source of truth that agents and skills **read before planning or generating code**, so every response follows the same shapes and facts.

This library deliberately does **not** repeat skill workflows. Skills define the *process* (steps, checklists); this library defines the *exact artifacts* to produce:

| File | Holds | Used for |
|------|-------|----------|
| [coding-standards.md](coding-standards.md) | Org-specific naming, architecture, opinionated conventions | Code generation & review |
| [planning-template.md](planning-template.md) | Fixed plan structure to fill before any code | Planning |
| [project-context.md](project-context.md) | Your org's data model, prefixes, integrations, layout | Grounding every task |

## Precedence

1. **Local `.agents/skills/` sf-skills** (org-specific) win on any conflict.
2. **This reference library** is the source of truth over generic/model defaults.
3. Skill workflows define the process around both.

## Maintaining

Keep these short and concrete. When a convention changes, update it here once — skills and agents cite this library rather than restating it, so there is a single place to change.
