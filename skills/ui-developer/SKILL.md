---
name: ui-developer
description: 'UI workflow: mockups, CSS, SLDS, color themes, React UI. Uses ui-ux-pro MCP for React design intelligence.'
argument-hint: 'Describe the UI task (e.g., "design a dark mode color theme for a dashboard")'
---

# UI Developer

Full multi-step workflow for UI-related tasks including mock design, CSS, Salesforce Lightning Design System (SLDS), color themes, and React UI development.

## Local sf-skill augmentation

Before starting, list the workspace `.agents/skills/` and pick any local sf-skill whose folder name/description matches the task (e.g. `design-systems-slds-apply`, `design-systems-slds-validate`, `design-systems-slds2-migrate`). sf-skills are renamed often — match by domain-first prefix (`design-systems-*`, `experience-*`), not exact names. If one matches, read its `SKILL.md` and follow it **together with** this workflow — sf-skills supply current platform mechanics; they do not replace these steps.

**Conflict rule:** this skill and the reference library win on workflow, conventions, naming, checklists, and output format. Local sf-skills win only on platform mechanics — current SLDS token/hook names, blueprint markup, and tool syntax.

## Reference library (read first)

Ground UI work in the project reference library (in your project at `.agents/reference/` for Copilot or `.codex/reference/` for Codex):
- `reference/project-context.md` — org/brand context, key objects, layout
- `reference/coding-standards.md` — LWC naming and structure conventions

Precedence: this skill + reference library, then local sf-skills (platform mechanics only).

## When to Use

- Creating or refining mock designs and wireframes
- Writing or debugging CSS / responsive layouts
- Applying SLDS tokens, components, or design patterns
- Choosing or generating color themes and palettes
- Building React component UI with proper styling
- Accessibility and visual QA reviews

## Workflow

### Step 1: Understand the UI Requirement

1. Identify the type of work:
   - **Mock/Wireframe**: Layout structure, component placement, user flow
   - **CSS/Styling**: Custom styles, responsive design, animations
   - **SLDS**: Lightning tokens, utility classes, component blueprints
   - **Color Theme**: Palette generation, dark/light mode, brand consistency
   - **React UI**: Component styling, design system integration
2. Clarify target platform: Salesforce Experience Cloud, standalone React app, or hybrid
3. Identify design constraints (brand colors, accessibility requirements, viewport targets)

### Step 2: Research & Design Intelligence

**For React UI tasks — use ui-ux-pro MCP:**

| Tool | Use For |
|------|---------|
| `get_design_system` | Generate a complete design system (colors, typography, UI style, layout) in one call |
| `search_ui_styles` | Find UI styles (Glassmorphism, Minimalism, Brutalism, etc.) |
| `search_colors` | Get industry-specific color palettes with hex codes |
| `search_typography` | Font pairings with Google Fonts imports and Tailwind configs |
| `search_stack` | React/Next.js specific guidelines (use `stack_name: "react"` or `"nextjs"`) |
| `search_ux_guidelines` | UX best practices, do's/don'ts, WCAG accessibility |
| `search_icons` | Curated Lucide icons with import codes |
| `search_landing` | Landing page patterns, Bento Grids, responsive strategy |
| `search_charts` | Chart types and data visualization recommendations |
| `search_all` | Cross-domain search when unsure which tool to use |

**For SLDS tasks — use these references:**
- SLDS design tokens: spacing, sizing, colors, typography
- SLDS component blueprints: structure, modifiers, states
- Lightning utility classes for rapid styling

### Step 3: Plan the UI

1. Define the layout structure (grid system, breakpoints)
2. Select color palette:
   - Primary, secondary, accent colors
   - Semantic colors (success, warning, error, info)
   - Dark mode variants if needed
3. Choose typography scale and font pairing
4. List components needed and their states (default, hover, active, disabled, error)

### Step 4: Implement

#### CSS Conventions
- Use CSS custom properties (`--variable`) for theming
- Mobile-first responsive design (`min-width` breakpoints)
- BEM naming for custom classes (`.block__element--modifier`)
- Prefer `rem`/`em` over `px` for scalable sizing
- Use logical properties (`margin-inline`, `padding-block`) for RTL support

#### SLDS Conventions
- Use SLDS design tokens over hardcoded values (`var(--sds-c-*)`)
- Apply `slds-` utility classes for spacing and layout
- Follow SLDS component blueprint structure exactly
- Use `slds-grid` / `slds-col` for layout
- Respect Lightning styling hooks for customization

#### React UI Conventions
- Component-scoped styles (CSS Modules, styled-components, or Tailwind)
- Design tokens as CSS variables or theme objects
- Responsive: use container queries or breakpoint hooks
- Animation: prefer CSS transitions; use `framer-motion` for complex cases
- Icons: Lucide React or project-specific icon set

### Step 5: Validate

1. **Visual**: Does it match the intended design/mock?
2. **Responsive**: Test at mobile (320px), tablet (768px), desktop (1024px+)
3. **Accessibility**:
   - Color contrast ratio ≥ 4.5:1 (text) / 3:1 (large text, UI elements)
   - Focus indicators visible
   - Semantic HTML elements used
   - ARIA labels where needed
4. **SLDS compliance** (if applicable): Tokens used, no hardcoded colors/spacing
5. **Dark mode**: Colors adapt correctly, no invisible text or elements
6. **Performance**: No layout shifts, images optimized, CSS efficiently structured

## Quality Checklist

- [ ] Color contrast meets WCAG AA (4.5:1 text, 3:1 UI)
- [ ] Responsive at 320px, 768px, 1024px+
- [ ] No hardcoded colors — uses tokens or CSS variables
- [ ] Hover/focus/active states defined for interactive elements
- [ ] Dark mode supported (if required)
- [ ] Typography hierarchy clear (h1 > h2 > h3 > body > caption)
- [ ] Spacing consistent (uses design token scale)
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Layout doesn't break with long text or missing content
- [ ] Icons have accessible labels or are marked `aria-hidden`

## ui-ux-pro MCP Integration

**Only invoke ui-ux-pro MCP when the task involves React UI.**

Workflow:
1. Use `get_design_system` for full design system generation (pass query describing the app type, e.g., "fintech dashboard dark mode")
2. Use specific search tools (`search_colors`, `search_typography`, etc.) for targeted lookups
3. The MCP returns CSS variables, Tailwind configs, and code-ready snippets — use them directly
4. Dark mode: include `mode: "dark"` in queries to get dark-mode palettes

Do NOT invoke ui-ux-pro MCP for Salesforce SLDS tasks — use SLDS documentation directly.

## SLDS Quick Reference

### Common Tokens
```
--sds-c-brand-primary          → Brand primary color
--sds-c-brand-secondary        → Brand secondary color
--sds-g-spacing-4              → 1rem spacing
--sds-g-font-size-5            → Base font size
--sds-g-radius-border-2        → Standard border radius
```

> **SLDS2 (Cosmos):** prefer global styling hooks (`--slds-g-*`) over legacy `--sds-*` tokens; for migrations, use the local `design-systems-slds2-migrate` sf-skill.

### Utility Classes
```
slds-grid / slds-wrap           → Flexbox grid
slds-col / slds-size_1-of-2    → Column sizing
slds-p-around_medium           → Padding
slds-m-bottom_small            → Margin
slds-text-heading_large        → Typography
slds-theme_default             → Theme application
```

## Color Theme Generation Pattern

When creating a custom color theme:
1. Define semantic roles: primary, secondary, accent, neutral, success, warning, error
2. Generate light mode palette first
3. Derive dark mode by adjusting lightness (not inverting)
4. Export as CSS custom properties for framework-agnostic use
5. Provide Tailwind config extension if project uses Tailwind

```css
:root {
  --color-primary: #0066FF;
  --color-on-primary: #FFFFFF;
  --color-surface: #FFFFFF;
  --color-on-surface: #1A1A1A;
}

[data-theme="dark"] {
  --color-primary: #3D8AFF;
  --color-on-primary: #FFFFFF;
  --color-surface: #0A0E14;
  --color-on-surface: #E5E5E5;
}
```
