 Project Management Component Library — Notes

**Date**: 2025-11-21  
**Status**: Planning

---

## Design Decisions

### Component Separation

**Why three separate leaf components?**
- Each has a distinct responsibility and prop surface
- Filter can evolve independently (e.g., add status filter later)
- Form can be reused in edit/create scenarios
- List can be used standalone for read-only views
- Follows low-cognitive-load principle (no mega components)

**Why a layout component?**
- Composes leafs without adding logic
- Provides consistent positioning and spacing
- Library page can demonstrate full composition
- Application pages can use layout or wire leafs directly

### Prop-Object Forwarding

Layout receives:
```ts
{
  projectsFilter: { nameFilter, onNameFilterChange },
  newProjectForm: { onSubmit },
  projectsList: { projects, onProjectClick, onProjectDelete }
}
```

Layout spreads each object directly:
```tsx
<ProjectsFilter {...projectsFilter} />
<NewProjectForm {...newProjectForm} />
<ProjectsList {...projectsList} />
```

This keeps the layout thin and avoids re-expressing leaf props.

---

## Interaction Details

### Delete Button Behavior

- Delete button must NOT trigger row click
- Use `event.stopPropagation()` in delete handler
- Visual distinction: delete button in a separate column or floating right

### Form Submission

- Submit disabled until name is non-empty
- Description is optional
- Form clears itself after successful submission
- Parent controls whether to add project to list (via `onSubmit` callback)

### Filtering Logic

- Filtering is case-insensitive
- Matches substring anywhere in project name
- Empty filter shows all projects
- Filter state lives in parent (layout or application page)
- No debouncing (library page is static, application can add it)

### Empty States

**ProjectsList**: 
- When `projects.length === 0`, show friendly message: "No projects yet. Create one below!"

**Filtered to zero**:
- When filter is active but no matches, show: "No projects match your filter."

---

## Edge Cases

### ProjectsList
- Empty array → show empty state
- Single project → no special handling
- Large list (50+) → no virtualization (out of scope for MVP)
- Long project names → truncate with ellipsis
- Long descriptions → truncate or wrap (TBD in STRUCTURE phase)

### ProjectsFilter
- Very long filter input → standard input handling
- Special characters → no sanitization (parent handles filtering)
- Copy/paste → native behavior

### NewProjectForm
- Name with only whitespace → treat as invalid (trim on validation)
- Very long name/description → no hard limit in UI (parent can enforce)
- Rapid submissions → form controls this (disable submit during submission flow if needed)
- Keyboard navigation → native form behavior, Enter to submit

---

## Testing Strategy

### Unit Tests (Per Component)

**ProjectsList**:
- Renders empty state when `projects = []`
- Renders list when `projects.length > 0`
- Calls `onProjectClick` with correct ID when row clicked
- Calls `onProjectDelete` with correct ID when X clicked
- Delete button does NOT trigger row click
- Renders name and description correctly

**ProjectsFilter**:
- Renders input with current value
- Calls `onNameFilterChange` when input changes
- Shows clear button when filter is non-empty
- Clears filter when clear button clicked

**NewProjectForm**:
- Submit button disabled when name is empty
- Submit button enabled when name is non-empty
- Calls `onSubmit` with correct data
- Clears form after submission
- Description is optional

**ProjectsPageLayout**:
- Renders all three child components
- Forwards props correctly to each child

### Fixtures

Each component has:
- `minimal()`: Smallest valid props (e.g., empty list, empty filter, no callbacks doing anything)
- `rich()`: Full multi-state props (e.g., 5+ projects, active filter, realistic callbacks)

### E2E Test

**ProjectsPageLayout.e2e.spec.ts**:
1. Visit library page with `?fixture=rich`
2. Verify all three components are visible
3. Type in filter input
4. Fill and submit new project form
5. Click a project row
6. Click a delete button
7. Take screenshot

Screenshot path: `e2e/screenshots/projects/ProjectsPageLayout/YYYY-MM-DDTHH-MM-SS.png`

---

## Styling Constraints

### From ThemePreview.tsx

**Surfaces**:
- Page background: `bg-app`
- Component cards: `bg-surface` with `shadow-card` and `rounded-card`
- Section dividers: `border-default`

**Typography**:
- Primary text: `text-primary`
- Secondary/meta text: `text-muted`
- Font sizes: `text-sm`, `text-base`, `text-lg`

**Controls**:
- Buttons: `rounded-button`, `shadow-card`, `bg-brand-primary`, `text-brand-secondary`
- Inputs: `rounded-control`, `border-default`, `bg-app`, `text-primary`, `placeholder:text-muted`
- Focus: `focus:border-[var(--control-input-border-focus)]`

**Actions**:
- Delete button: `text-error` or `bg-error`, `hover:opacity-80`
- Hover: `hover:bg-muted` or `hover:shadow-popover`

**Spacing**:
- Use Tailwind spacing scale: `space-4`, `space-6`, `space-8`, `gap-4`, `p-6`, etc.

---

## Constraints & Non-Goals

### Constraints

1. **No Modifications to**:
   - `src/styles/**`
   - `src/library/styles/**`
   - `src/state/**`
   - `src/services/**`
   - Existing components
   - Theme configuration

2. **Pure Presentation Only**:
   - No API calls
   - No global state
   - No routing logic
   - No data persistence

3. **Deterministic Library Pages**:
   - No randomness in fixtures
   - No network requests
   - Same DOM every time for E2E stability

### Non-Goals (Explicitly Out of Scope)

- Sorting projects
- Multi-column filtering
- Pagination
- Infinite scroll
- Project editing (in-place or modal)
- Bulk operations (select all, delete multiple)
- Undo/redo
- Drag-and-drop reordering
- Export/import
- Search highlighting
- Advanced validation (beyond "name required")
- Loading states (no async operations)
- Error boundaries
- Internationalization

---

## Open Questions

### Resolved During Planning

**Q**: Should ProjectsList show both name and description?  
**A**: Yes. Name as primary text, description as secondary/muted text.

**Q**: Should filter clear automatically when projects change?  
**A**: No. Filter is controlled by parent; parent decides.

**Q**: Should form validation be inline or on submit?  
**A**: Inline. Submit button disabled if name is empty.

**Q**: Should we handle duplicate project names?  
**A**: No. Parent is responsible for uniqueness (if needed).

### To Resolve in STRUCTURE Phase

- Exact layout spacing (vertical gaps between filter, form, list)
- Delete button icon (text "X", "✕", or SVG?)
- Project row layout (single line vs multi-line for description)
- List container styling (border? shadow? plain?)

---

## Dependencies

### External Libraries (Already in Project)

- React 18+
- TailwindCSS (configured)
- Jest (testing)
- Playwright (E2E)
- TypeScript

### Internal Dependencies

- None (this is a new isolated module)

---

## Success Criteria

Phase 2 is successful when:

- [ ] All 22 files created
- [ ] All components render without errors
- [ ] All unit tests pass with 100% coverage
- [ ] All fixtures are deterministic
- [ ] All library pages load correctly
- [ ] E2E test passes and screenshot is generated
- [ ] All styling follows ThemePreview patterns
- [ ] No linter errors
- [ ] No TypeScript errors
- [ ] No modifications to forbidden files
- [ ] This plan is updated with final summary

---

## Next Steps

**Awaiting Approval**

Once approved, proceed to Phase 2:
1. Create all skeleton files (SCAFFOLD)
2. Build DOM structure (STRUCTURE)
3. Add logic and callbacks (LOGIC)
4. Apply styling (STYLING)
5. Write unit tests (UNIT)
6. Create library pages (LIBRARY PAGE)
7. Write E2E test with screenshot (E2E + IMAGE)
8. Update plan.md with summary (SUMMARY)

