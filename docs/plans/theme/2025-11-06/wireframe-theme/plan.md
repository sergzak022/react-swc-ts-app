# Wireframe Theme Setup Plan

## Intent

Implement a high-quality wireframe-inspired design system using CSS Modules with:
- Grayscale color palette (black, white, shades of gray)
- Subtle shadows for elevation
- Rounded corners for cards and buttons
- Comfortable spacing
- Sleek dark mode
- Muted status color hints (green, amber, red)

## Scope

### In Scope
- Create complete CSS Modules architecture (palettes, tokens, semantic, themes)
- Build ThemePreview dev page for visual validation
- Wire up theme toggle functionality
- Support light and dark modes

### Out of Scope
- Modifying existing component files
- Applying theme to existing components
- Component-specific CSS implementations

## Semantic Token Matrix

### Surfaces
| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `--color-bg-app` | `--paper` (white) | `--ink` (near-black) | Root background |
| `--color-bg-surface` | `--neutral-50` | `--neutral-800` | Card/panel surfaces |
| `--color-bg-muted` | `--neutral-100` | `--neutral-700` | Secondary surfaces |

### Typography
| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `--color-fg-primary` | `--ink` (near-black) | `--paper` (white) | Primary text |
| `--color-fg-muted` | `--neutral-600` | `--neutral-400` | Secondary text |
| `--color-fg-inverse` | `--paper` | `--ink` | Inverse text |

### Borders
| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `--color-border` | `--neutral-300` | `--neutral-700` | Default borders |
| `--color-border-strong` | `--neutral-400` | `--neutral-600` | Emphasized borders |

### Brand
| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `--color-brand-primary` | `--neutral-900` | `--neutral-100` | Primary brand |
| `--color-brand-secondary` | `--neutral-700` | `--neutral-300` | Secondary brand |

### Status
| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `--color-success` | `--success-500` | `--success-500` | Success states |
| `--color-warning` | `--warning-500` | `--warning-500` | Warning states |
| `--color-error` | `--error-500` | `--error-500` | Error states |

### Controls
| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `--color-bg-button` | `--neutral-900` | `--neutral-100` | Button background |
| `--color-fg-button` | `--paper` | `--ink` | Button text |
| `--color-bg-input` | `--paper` | `--neutral-800` | Input background |
| `--color-fg-input` | `--ink` | `--paper` | Input text |

### Elevation
| Token | Value | Purpose |
|-------|-------|---------|
| `--elevation-card` | `--shadow-1` | Card shadows |
| `--elevation-popover` | `--shadow-2` | Popover shadows |
| `--elevation-modal` | `--shadow-4` | Modal shadows |

## Theme Switching

- Method: `.dark` class on `document.documentElement`
- Toggle via: `document.documentElement.classList.toggle('dark')`
- Default: Light theme (no class)

