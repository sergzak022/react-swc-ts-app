# Design Rationale

## Wireframe Aesthetic

The theme draws inspiration from high-quality wireframe designs, emphasizing:

### 1. Grayscale Palette
- **Black** (`#0a0a0a`) and **white** (`#ffffff`) as anchors
- **Gray scale** for surfaces, borders, and hierarchy
- Maintains wireframe simplicity while providing visual depth
- Easy to scan and understand information architecture

### 2. Subtle Shadows
Unlike flat wireframes, this theme uses elevation to create depth:
- **Level 0**: No shadow (flush elements)
- **Level 1**: `0 1px 3px rgba(0,0,0,0.04)` - Cards
- **Level 2**: `0 2px 6px rgba(0,0,0,0.06)` - Popovers
- **Level 3**: `0 4px 12px rgba(0,0,0,0.08)` - Dropdowns
- **Level 4**: `0 8px 24px rgba(0,0,0,0.10)` - Modals

Shadows are minimal but perceptible, creating a modern, refined look.

### 3. Rounded Corners
Softens the wireframe aesthetic while maintaining clarity:
- **Small** (`4px`): Inputs, chips, badges
- **Medium** (`6px`): Buttons
- **Large** (`8px`): Cards, panels
- **Extra large** (`12px`): Large containers, dialogs

### 4. Comfortable Spacing
Based on `0.25rem` (4px) increments:
- Tight: `0.25rem`, `0.5rem` (micro spacing)
- Standard: `0.75rem`, `1rem` (element spacing)
- Generous: `1.5rem`, `2rem`, `3rem`, `4rem` (section spacing)

Base unit (`--space-unit`) is `1rem` for comfortable reading and interaction.

### 5. Typography Hierarchy
System font stack for native feel:
- Uses platform defaults (San Francisco on macOS, Segoe UI on Windows)
- Four size tiers: xs (12px), sm (14px), md (16px), lg (18px)
- Two line-height modes: tight (1.15) for headings, normal (1.4) for body

### 6. Dark Mode Strategy
Sleek, modern dark mode that:
- **Flips** `--ink` and `--paper` usage
- Uses darker surfaces (`--neutral-800`, `--neutral-900`)
- Maintains contrast ratios for accessibility
- Adjusts brand colors to lighter tones for visibility
- Keeps shadows but may adjust opacity for dark backgrounds

### 7. Status Colors
Muted tones that hint rather than shout:
- **Success**: `#10b981` (muted green)
- **Warning**: `#f59e0b` (amber)
- **Error**: `#ef4444` (red)

These provide functional feedback without overwhelming the grayscale aesthetic.

## Component Usage Pattern

Components should:
1. **Never** hardcode colors or spacing values
2. **Always** use semantic CSS variables
3. **Reference** `--color-fg-primary`, not `--neutral-900`
4. **Apply** `--radius-card`, not hardcoded `8px`
5. **Use** `--elevation-card`, not manual `box-shadow`

This ensures theme changes propagate automatically and maintains consistency.

## Naming Conventions

### Palette Layer
- Format: `--{scale}-{weight}`
- Examples: `--neutral-500`, `--success-500`
- Purpose: Raw color values, never used directly by components

### Token Layer
- Format: `--{category}-{variant}`
- Examples: `--space-4`, `--radius-md`, `--shadow-1`
- Purpose: Primitive design values

### Semantic Layer
- Format: `--color-{purpose}-{variant}` or `--{purpose}-{variant}`
- Examples: `--color-bg-surface`, `--color-fg-muted`, `--elevation-card`
- Purpose: Intent-based names that components consume

### Theme Layer
- Assigns palette/token values to semantic variables
- Different assignments for `:root` (light) and `:root.dark` (dark)

## Accessibility Considerations

- Contrast ratios meet WCAG AA standards
- Dark mode uses appropriate luminance for readability
- Focus states will use `--color-border-strong`
- Interactive elements have minimum 44×44px touch targets (via spacing)

