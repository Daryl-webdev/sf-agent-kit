# UI Design Reference

Use the project design system first. Treat tokens shown here as examples; verify availability for the project SLDS version.

## Design tools for React

If explicitly requested or a concrete React design gap remains after local research, use the smallest applicable ui-ux-pro lookup.

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
