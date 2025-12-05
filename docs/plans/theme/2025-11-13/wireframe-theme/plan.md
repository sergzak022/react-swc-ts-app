# Wireframe Theme Implementation Plan

## Theme Name & Goal

**Wireframe Theme (High-Fidelity)** — A Tailwind CSS theme system that implements a high-fidelity wireframe aesthetic, featuring:

- Black, white, and gray color palette as primary brand colors
- Rounded borders and buttons for visual softness
- Subtle, minimal shadows for depth without distraction
- Comfortable spacing for a relaxed layout feel
- Sleek, high-contrast dark mode (not pure black)
- Muted status colors (green, amber, red) for indicators

## Palette Decisions

### Brand Palette
- **Primary**: Black (#000000) — main brand, buttons, strong accents
- **Secondary**: White (#ffffff) — alternative accents, inverse elements

### Neutral Palette
- **Scale**: 50–950 grayscale (light to dark)
- **Light range** (50–200): Surfaces, muted backgrounds
- **Mid range** (400–500): Borders, secondary text
- **Dark range** (600–950): Text, strong elements, deep backgrounds

### Status Palette
- **Success**: Muted green (50–950 scale, primary: #22c55e)
- **Warning**: Amber (50–950 scale, primary: #f59e0b)
- **Error**: Red (50–950 scale, primary: #ef4444)

### Contrast Palette
- **Ink (light)**: #222222 — dark text for light backgrounds
- **Ink (dark)**: #fafafa — light text for dark backgrounds
- **Paper (light)**: #ffffff — light backgrounds
- **Paper (dark)**: #0f0f0f — deep dark backgrounds (not pure black for better contrast)

## Primitives

### Spacing
- Base unit: 0.25rem (4px)
- Scale: 0 through 64 (0–256px)
- Comfortable padding/margins for relaxed layout

### Border Radii
- **sm**: 0.25rem (4px) — subtle
- **md**: 0.5rem (8px) — controls and inputs
- **lg**: 0.75rem (12px) — cards and large components
- **xl**: 1rem (16px) — very large surfaces
- **full**: 9999px — pills and fully rounded elements

### Typography
- **Font family**: System font stack (system-ui, -apple-system, etc.)
- **Font sizes**: xs (12px) → 6xl (60px)
- **Font weights**: 100–900 (thin to black)
- **Letter spacing**: Tighter to widest for semantic control

### Motion
- **Durations**: 75ms → 1000ms
- **Timings**: linear, ease-in, ease-out, ease-in-out

### Shadows
- **sm**: 0 1px 2px with low opacity
- **base**: Subtle multi-layer shadow
- **md, lg, xl, 2xl**: Progressive elevation
- **Dark mode**: Higher opacity for visibility on dark backgrounds

### Z-Index
- **Utility scale**: 0, 10, 20, ..., 50
- **Semantic**: dropdown (1000), sticky (1100), overlay (1300), modal (1400), popover (1500), tooltip (1600)

## Semantic Tokens

### Backgrounds
- `--bg-app`: Main application background
- `--bg-surface`: Primary content surface
- `--bg-muted`: Secondary/reduced-emphasis surface

### Foregrounds (Text)
- `--fg-primary`: Main text color
- `--fg-muted`: Secondary/de-emphasized text
- `--fg-inverse`: Text on dark/brand backgrounds

### Borders
- `--border-default`: Standard borders
- `--border-strong`: Emphasized borders
- `--border-muted`: Subtle/disabled borders

### Brand
- `--brand-primary`: Black (#000000)
- `--brand-secondary`: White (#ffffff)

### Status
- `--status-success`: Success indicator
- `--status-warning`: Warning indicator
- `--status-error`: Error indicator

### Controls
- `--control-button-bg/fg`: Button colors
- `--control-input-bg/fg/border/border-focus`: Input field colors and states

### Layout & Radii
- `--layout-spacing`: Base spacing unit
- `--radius-card/button/control`: Radius aliases for different component types

### Elevation
- `--elevation-card/popover/modal`: Shadow levels for depth hierarchy

## Themes

### Light Theme
- **Background hierarchy**: White → Light Gray (#fafafa) → Lighter Gray (#f5f5f5)
- **Text**: Dark gray (#222222), secondary gray (#737373)
- **Borders**: Neutral grays (300–400)
- **Brand**: Black primary, white secondary
- **Status**: Darker shade variants for good contrast
- **Shadows**: Subtle, low opacity

### Dark Theme
- **Background hierarchy**: Deep gray (#0f0f0f) → Dark gray (#222222) → Darker gray (#383838)
- **Text**: Light gray (#fafafa), mid gray (#cccccc)
- **Borders**: Lighter grays (600–700)
- **Brand**: Light gray primary, dark gray secondary (inverted perception)
- **Status**: Lighter shade variants for visibility
- **Shadows**: Higher opacity for visibility on dark surfaces

## Scope

- **New files**: 6 TypeScript files in `src/styles/`, 1 utility file, 1 config file
- **Modified files**: `src/index.css`, `src/main.tsx`, `tailwind.config.js` → `tailwind.config.ts`
- **Updated files**: `src/library/styles/ThemePreview.tsx` (now uses Tailwind utilities)
- **Removed files**: Old CSS theme files (if they existed separately)
- **Documentation**: 3 planning documents

## Timeline & Workflow

1. **Plan** (this document) — Intent, decisions, scope
2. **Scaffold** — Directory structure
3. **Implement Tokens** — Palettes, primitives, semantic tokens
4. **Implement Themes** — Light/dark theme mappings
5. **Configure** — Tailwind config and plugin
6. **Update Preview** — ThemePreview component
7. **Add Utilities** — Theme toggle and initialization
8. **Document** — Finalize planning, notes, file list

## Notes

- Palettes defined in TypeScript allow for easy reuse and tree-shaking
- Semantic tokens provide a single source of truth for all theme values
- The plugin approach ensures tokens are available as CSS variables and Tailwind utilities
- Dark mode uses `.dark` class on `<html>` element (Tailwind's class-based dark mode)
- Theme is initialized from localStorage on app startup
- ThemePreview component serves as visual reference for all tokens (dev-only route)

