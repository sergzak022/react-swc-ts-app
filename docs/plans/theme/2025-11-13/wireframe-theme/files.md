# Files Created & Modified

## Theme Core System (New)

### `src/styles/palettes.ts`
- **Purpose**: Defines raw color scales (brand, neutral, status, contrast)
- **Status**: ✓ Created
- **Key exports**:
  - `brandPalette` — primary (black shades) and secondary (white shades)
  - `neutralPalette` — grayscale 50–950
  - `statusPalette` — success/warning/error with full scales
  - `contrastPalette` — ink and paper colors for text/background contrast

### `src/styles/tokens.ts`
- **Purpose**: Design primitives (spacing, radii, typography, motion, shadows, z-index)
- **Status**: ✓ Created
- **Key exports**:
  - `spacing` — 0, 1–64 scale (0–256px)
  - `radii` — sm/md/lg/xl/full
  - `typography` — fontFamily, fontSize, fontWeight, letterSpacing
  - `motion` — transitionDuration, transitionTimingFunction
  - `shadows` — none, sm, base, md, lg, xl, 2xl
  - `zIndex` — utility and semantic (dropdown, modal, tooltip, etc.)

### `src/styles/semantic.ts`
- **Purpose**: Semantic token structure mapping intent-based names
- **Status**: ✓ Created
- **Key exports**:
  - `semanticTokens` — object defining all token names (bg.*, fg.*, border.*, brand.*, status.*, control.*, layout.*, radius.*, elevation.*)
  - Used by Tailwind plugin to generate CSS custom properties

### `src/styles/themes/light.ts`
- **Purpose**: Light theme mappings (semantic → palette/primitive values)
- **Status**: ✓ Created
- **Contents**:
  - All semantic tokens mapped to light palette values
  - White/light gray backgrounds, dark text, subtle borders
  - Black brand primary, white brand secondary
  - Standard shadows for light mode

### `src/styles/themes/dark.ts`
- **Purpose**: Dark theme mappings with proper contrast and elevation adaptations
- **Status**: ✓ Created
- **Contents**:
  - All semantic tokens mapped to dark palette values
  - Deep gray backgrounds (#0f0f0f), light text, lighter borders
  - Light gray brand primary, dark gray brand secondary
  - Adjusted shadows with higher opacity for dark backgrounds

### `src/styles/index.ts`
- **Purpose**: Theme system entry point; exports all modules and provides Tailwind plugin
- **Status**: ✓ Created
- **Key exports**:
  - Re-exports from `palettes`, `tokens`, `semantic`, `themes`
  - `tailwindPlugin` — Tailwind plugin that:
    - Injects `:root` (light) and `.dark` CSS custom properties
    - Adds semantic token utility classes (`.bg-app`, `.text-primary`, `.shadow-card`, etc.)

## Configuration Files (New/Modified)

### `tailwind.config.ts`
- **Purpose**: Tailwind CSS configuration with custom plugin and theme extensions
- **Status**: ✓ Created (converted from `.js`)
- **Contents**:
  - `darkMode: 'class'` for `.dark`-based dark mode
  - `content` paths for component scanning
  - `theme.extend` with custom spacing, radii, typography, zIndex, shadows
  - `plugins` array with `tailwindPlugin`

### `postcss.config.js`
- **Purpose**: PostCSS configuration for Tailwind
- **Status**: ✓ Already existed (not modified)
- **Contents**: Already includes tailwindcss and autoprefixer

## Application Files (Modified)

### `src/index.css`
- **Purpose**: Global stylesheet with Tailwind directives
- **Status**: ✓ Modified (cleaned up, removed old imports)
- **Contents**:
  - Tailwind directives (@tailwind base/components/utilities)
  - Minimal base resets (margin, font-family for inherit)

### `src/main.tsx`
- **Purpose**: App entry point with router configuration
- **Status**: ✓ Modified
- **Changes**:
  - Added import for `ThemePreview` component
  - Added import for `initTheme` from theme toggle utility
  - Called `initTheme()` on startup (reads localStorage, sets theme)
  - Added route for `/library/styles/preview` → `<ThemePreview />`

### `src/library/styles/ThemePreview.tsx`
- **Purpose**: Dev-only theme preview component demonstrating all tokens
- **Status**: ✓ Created (completely rewritten for Tailwind)
- **Features**:
  - Theme toggle button (☀️/🌙) to switch between light/dark
  - Sections: Surfaces & Text, Brand & Status, Controls & Forms, Spacing Scale, Border Radius, Elevation & Shadows, Border Colors
  - All tokens labeled inline with semantic names
  - Responsive multi-column grid layout
  - Uses Tailwind utility classes exclusively

### `src/utils/themeToggle.ts`
- **Purpose**: Theme persistence and toggle utility
- **Status**: ✓ Created
- **Key exports**:
  - `initTheme()` — Initialize from localStorage on startup
  - `toggleTheme()` — Toggle dark class and persist
  - `getCurrentTheme()` — Get current theme ('dark' or 'light')
  - `setTheme(theme)` — Set theme explicitly

## Removed Files

- **Old CSS theme files** (if they existed):
  - `src/styles/index.css` → Removed (now TypeScript-based in `src/styles/index.ts`)
  - `src/styles/palettes.css` → Removed
  - `src/styles/tokens.css` → Removed
  - `src/styles/semantic.css` → Removed
  - `src/styles/themes/light.css` → Removed
  - `src/styles/themes/dark.css` → Removed

## Documentation Files (New)

### `docs/plans/theme/2025-11-13/wireframe-theme/plan.md`
- **Purpose**: Theme intent, decisions, and workflow
- **Status**: ✓ Created

### `docs/plans/theme/2025-11-13/wireframe-theme/files.md`
- **Purpose**: This file — list of created/modified files
- **Status**: ✓ Created

### `docs/plans/theme/2025-11-13/wireframe-theme/notes.md`
- **Purpose**: Rationale, edge cases, extension hints
- **Status**: ✓ Created

## Summary

- **Theme Core**: 6 new TypeScript files
- **Configuration**: 1 new TypeScript config
- **Application**: 3 modified files, 1 new utility file
- **Preview**: 1 completely redesigned component
- **Documentation**: 3 planning documents
- **Total new files**: 13
- **Total modified files**: 4
- **Total removed files**: 6 (old CSS theme files)

