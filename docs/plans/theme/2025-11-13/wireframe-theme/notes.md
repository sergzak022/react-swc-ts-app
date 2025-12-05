# Implementation Notes & Extension Guide

## Theme Rationale

### Why Black, White, and Gray?

The wireframe aesthetic traditionally uses minimal color to emphasize **structure and hierarchy** over decoration. By restricting the primary brand palette to black and white:

- **Visual clarity**: No color distraction; focus on layout and form
- **Accessibility**: High contrast for legibility
- **Professional appearance**: Clean, minimalist aesthetic
- **Flexibility**: Easy to add accent colors later without conflicts

Grayscale neutrals provide a full spectrum for backgrounds, borders, and text emphasis.

### Dark Mode Implementation

The dark theme is **not a naive invert** of the light theme. Instead:

- **Background**: Deep gray (#0f0f0f), not pure black, for better contrast with text
- **Surfaces**: Stepped grays (#222222, #383838) for visual hierarchy
- **Borders**: Lighter grays (600–700) for visibility
- **Text**: Light gray (#fafafa) for comfortable reading
- **Shadows**: Higher opacity (0.3–0.5) to remain visible
- **Brand perception**: Inverted — light gray feels "primary" in dark mode, creating visual balance

### Status Colors

Status colors (success/warning/error) use muted variants:

- **Success**: Green (#22c55e) — recognizable without overwhelming
- **Warning**: Amber (#f59e0b) — distinct from success, not red
- **Error**: Red (#ef4444) — clear danger signal
- **Light mode**: Darker shades (600–700) for contrast on white
- **Dark mode**: Lighter shades (400) for contrast on gray

This avoids "neon" or "candy" colors while remaining functional.

### Spacing Philosophy

The 4px base unit (0.25rem) ensures:

- **Comfortable breathing room**: 16px (1rem) becomes a natural default
- **Flexible scaling**: Works well from 4px micro-adjustments to 256px (16rem) macro spacing
- **Consistency**: All spacing derived from the same base ratio

## Design Decision Details

### Rounded Corners

- **sm (4px)**: Barely perceptible, used for very subtle control elements
- **md (8px)**: Standard for buttons and form inputs
- **lg (12px)**: Cards, larger components
- **xl (16px)**: Full surfaces, modal containers

All radii are **subtle** — not the 16px+ "pill" aesthetic. This maintains the wireframe's focus on form over ornament.

### Shadows

Shadows are **minimal** to avoid competing with structure:

- **Card shadow**: 0 1px 3px with 0.1 opacity — barely perceptible, suggests slight lift
- **Popover shadow**: 0 10px 15px with 0.1 opacity — more prominent, suggests active focus
- **Modal shadow**: 0 20px 25px with 0.1 opacity — strong but not overwhelming
- **Dark mode**: Opacity bumped to 0.3–0.5 for visibility

No hard drop shadows or multiple layers that would clutter the interface.

### Typography

System font stack prioritizes **clarity**:

```
system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
```

This ensures:

- Consistent appearance across OS
- Native rendering (faster, less bloat)
- Professional appearance
- No custom font licensing

Font weights (100–900) and sizes (12px–60px) cover all semantic needs without requiring custom fonts.

## Edge Cases & Decisions

### Contrast in Dark Mode

**Issue**: Pure black (#000000) for buttons in dark mode can appear washed out.

**Solution**: Brand primary in dark mode is light gray (#f5f5f5), creating clear contrast against dark backgrounds while maintaining the grayscale aesthetic.

### Input Border Focus

**Light mode**: Black border focus (#000000) — clear, strong signal
**Dark mode**: Light gray border focus (#f5f5f5) — equally clear, respects the palette

### Muted Text

**Light mode**: #737373 (neutral-600) — readable but not heavy
**Dark mode**: #cccccc (neutral-400) — lighter, still readable on dark backgrounds

These were chosen to meet WCAG AA contrast ratios while maintaining the subtle hierarchy.

## Consuming the Theme System

### For LLMs Styling Components

1. **Read the Theme Preview**
   - Navigate to `/library/styles/preview` in dev mode
   - See all tokens visually rendered in both themes

2. **Understand the Hierarchy**
   - **Backgrounds**: app (main) → surface (secondary) → muted (tertiary)
   - **Text**: primary (dark) → muted (lighter) → inverse (on brand colors)
   - **Brands**: primary (black) → secondary (white)
   - **Status**: success/warning/error for semantic feedback
   - **Controls**: button and input specific tokens
   - **Elevation**: card < popover < modal

3. **Use Semantic Utilities**
   - `bg-app`, `bg-surface`, `bg-muted` for backgrounds
   - `text-primary`, `text-muted`, `text-inverse` for text
   - `border-default`, `border-strong`, `border-muted` for borders
   - `bg-success`, `text-error`, etc. for status feedback
   - `shadow-card`, `shadow-popover`, `shadow-modal` for elevation
   - `rounded-card`, `rounded-button`, `rounded-control` for radii

4. **Combine with Tailwind Utilities**
   - Spacing: `p-4`, `m-6`, `gap-8`
   - Typography: `text-lg`, `font-semibold`, `font-mono`
   - Layouts: `flex`, `grid`, `absolute`
   - States: `hover:`, `focus:`, `dark:` prefix

### For Humans

1. Run dev server: `npm run start`
2. Navigate to `http://localhost:5173/library/styles/preview`
3. Toggle between light/dark themes
4. Inspect elements to see which tokens are used
5. Reference `src/styles/` files for exact color/spacing values

## Extension & Maintenance

### Adding a New Semantic Token

**Scenario**: Need a new token like `--elevation-overlay` for floating panels.

**Steps**:

1. Add to `src/styles/semantic.ts`:
   ```typescript
   elevation: {
     card: '--elevation-card',
     popover: '--elevation-popover',
     overlay: '--elevation-overlay', // NEW
   }
   ```

2. Add to `src/styles/themes/light.ts`:
   ```typescript
   '--elevation-overlay': shadows.xl,
   ```

3. Add to `src/styles/themes/dark.ts`:
   ```typescript
   '--elevation-overlay': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
   ```

4. Add utility to `src/styles/index.ts`:
   ```typescript
   addUtilities({
     '.shadow-overlay': { boxShadow: 'var(--elevation-overlay)' },
   });
   ```

5. Add example to `src/library/styles/ThemePreview.tsx`:
   ```tsx
   <div className="bg-surface p-8 rounded-card shadow-overlay">
     <strong>shadow-overlay</strong>
   </div>
   ```

6. Update `notes.md` documenting the addition.

### Adding a Third Theme (High Contrast)

**Scenario**: Need a high-contrast theme for accessibility.

**Steps**:

1. Create `src/styles/themes/high-contrast.ts`:
   ```typescript
   export const highContrastTheme = {
     '--bg-app': '#ffffff',
     '--fg-primary': '#000000', // Even stronger contrast
     '--brand-primary': '#000000',
     // ... all tokens with maximum contrast
   };
   ```

2. Export from `src/styles/index.ts`:
   ```typescript
   export { highContrastTheme } from './themes/high-contrast';
   ```

3. Update plugin in `src/styles/index.ts` to handle new class:
   ```typescript
   addBase({
     ':root': lightTheme,
     '.dark': darkTheme,
     '.high-contrast': highContrastTheme,
   });
   ```

4. Update `tailwind.config.ts` if needed (for class-based selection).

5. Update `ThemePreview.tsx` to toggle between all three themes.

### Updating Palette Colors

**Scenario**: Client wants slightly different gray scale.

**Steps**:

1. Modify `src/styles/palettes.ts`:
   ```typescript
   export const neutralPalette = {
     50: '#fcfcfc', // Slightly different
     // ... other shades
   };
   ```

2. Verify `src/styles/themes/light.ts` and `dark.ts` still reference valid keys.

3. Check `ThemePreview.tsx` visually for contrast issues.

4. Update `notes.md` with rationale for change.

## Testing & Validation Checklist

- [ ] ThemePreview renders without errors on `/library/styles/preview`
- [ ] Toggle button switches between light and dark modes
- [ ] Light theme looks clean (white background, dark text, subtle shadows)
- [ ] Dark theme looks sleek (deep gray background, light text, visible shadows)
- [ ] All control examples (input, button, select, checkbox) work and look good
- [ ] Spacing scale demonstrates comfortable padding
- [ ] Border radius examples show subtle rounded aesthetic
- [ ] Shadow examples show proper elevation hierarchy
- [ ] Status colors are visible and distinct in both themes
- [ ] Text contrast meets WCAG AA standards
- [ ] App components can be styled using semantic tokens without issues

## References

- **Tailwind Config**: `tailwind.config.ts`
- **Theme Entry Point**: `src/styles/index.ts`
- **Semantic Token Map**: `src/styles/semantic.ts`
- **Palette Source**: `src/styles/palettes.ts`
- **Primitive Tokens**: `src/styles/tokens.ts`
- **Light Theme**: `src/styles/themes/light.ts`
- **Dark Theme**: `src/styles/themes/dark.ts`
- **Theme Toggle Utility**: `src/utils/themeToggle.ts`
- **Live Preview**: `src/library/styles/ThemePreview.tsx` (route: `/library/styles/preview`)

## Future Enhancements

- Add CSS-in-JS alternative theme export (for emotion/styled-components)
- Add a "compact" spacing variant for dense UIs
- Add typography presets (e.g., `.heading-1`, `.body-text`)
- Add color mode inference from system preferences (already in themeToggle.ts, could be exposed)
- Build a figma plugin to sync design tokens with this theme system
- Add animation presets (transitions, transforms)
- Document component styling patterns that use these tokens

## Conclusion

This theme system provides a complete, extensible foundation for building professional, accessible interfaces with a high-fidelity wireframe aesthetic. The Tailwind + CSS variables approach balances performance, maintainability, and developer experience.

Future LLMs should:
1. Always reference `ThemePreview.tsx` for visual context
2. Use semantic utilities instead of arbitrary values
3. Keep component styles out of `src/styles/` (only theme system belongs there)
4. Update `notes.md` when adding new tokens or themes

