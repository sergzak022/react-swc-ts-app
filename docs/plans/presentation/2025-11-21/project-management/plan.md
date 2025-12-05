# Project Management Component Library — Plan

**Date**: 2025-11-21  
**Status**: ✅ Complete  
**Workflow**: New UI Functionality (Presentation Layer)

---

## Intent

Build a complete project management interface composed of three leaf components and one layout.

The interface enables:
- Viewing a list of projects with inline delete actions
- Filtering projects by name (client-side, no data fetching)
- Creating new projects via a form (name + description)
- Selecting a project row (callback for future navigation)

All components are pure presentation units with no business logic, API calls, or global state dependencies.

---

## Component Breakdown

### Leaf Components

#### 1. `ProjectsList`
- **Purpose**: Display a list of projects with delete and click actions
- **Responsibilities**:
  - Render each project as a clickable row
  - Show project name and description
  - Include an "X" button for deletion
  - Emit callbacks for row click and delete
- **Visual States**:
  - Empty state (no projects)
  - Populated list (1+ projects)
  - Hover states for rows and delete button

#### 2. `ProjectsFilter`
- **Purpose**: Provide name-based filtering UI
- **Responsibilities**:
  - Display a text input for name filtering
  - Emit filter value changes
  - Show clear/reset functionality if filter is active
- **Visual States**:
  - Empty filter
  - Active filter (with clear button)

#### 3. `NewProjectForm`
- **Purpose**: Capture new project data (name + description)
- **Responsibilities**:
  - Two inputs: name (required), description (optional)
  - Submit button (disabled if name is empty)
  - Local form state management
  - Clear form after successful submit
- **Visual States**:
  - Empty form
  - Partially filled
  - Fully filled (submit enabled)
  - Validation feedback (name required)

### Layout Component

#### `ProjectsPageLayout`
- **Purpose**: Compose the three leafs into a cohesive page
- **Responsibilities**:
  - Position filter at top
  - Position form below filter
  - Position list below form
  - Use prop-object forwarding pattern
- **Structure**:
  ```tsx
  interface ProjectsPageLayoutProps {
    projectsFilter: ProjectsFilterProps;
    newProjectForm: NewProjectFormProps;
    projectsList: ProjectsListProps;
  }
  ```

---

## Prop Contracts (Draft)

### Shared Types

```ts
export interface Project {
  id: string;
  name: string;
  description: string;
}
```

### ProjectsList

```ts
export interface ProjectsListProps {
  /** Array of projects to display */
  projects: Project[];
  /** Fired when a project row is clicked */
  onProjectClick: (projectId: string) => void;
  /** Fired when delete button is clicked */
  onProjectDelete: (projectId: string) => void;
}
```

### ProjectsFilter

```ts
export interface ProjectsFilterProps {
  /** Current filter value */
  nameFilter: string;
  /** Fired when filter input changes */
  onNameFilterChange: (value: string) => void;
}
```

### NewProjectForm

```ts
export interface NewProjectFormProps {
  /** Fired when form is submitted with valid data */
  onSubmit: (project: { name: string; description: string }) => void;
}
```

### ProjectsPageLayout

```ts
export interface ProjectsPageLayoutProps {
  projectsFilter: ProjectsFilterProps;
  newProjectForm: NewProjectFormProps;
  projectsList: ProjectsListProps;
}
```

---

## Interaction Scenarios

1. **User filters projects**:
   - Types in filter input → `onNameFilterChange` fires
   - List updates to show matching projects
   - Clicks clear button → filter resets, full list shown

2. **User creates a new project**:
   - Fills name (required) and description (optional)
   - Clicks submit → `onSubmit` fires with data
   - Form clears automatically
   - New project appears in list

3. **User deletes a project**:
   - Clicks X button on a row → `onProjectDelete` fires with ID
   - Project removed from list

4. **User selects a project**:
   - Clicks anywhere on row (except delete button) → `onProjectClick` fires with ID
   - (Future: navigation to project details)

---

## Visual States Coverage

### ProjectsList
- Empty list with placeholder message
- 1-3 projects (minimal)
- 5+ projects (rich)
- Hover states for rows and delete buttons

### ProjectsFilter
- No filter applied
- Filter applied with matches
- Filter applied with no matches

### NewProjectForm
- Pristine (empty)
- Name only
- Name + description
- Submit disabled (name empty)
- Submit enabled (name filled)

---

## Acceptance Criteria

- [x] All three leafs created with typed props
- [x] Layout uses prop-object forwarding pattern
- [x] No business logic in any component
- [x] No API calls or global state dependencies
- [x] 100% unit test coverage for all components
- [x] Fixtures created: `minimal()` and `rich()` for each leaf and layout
- [x] Library pages created for each component (dev-only)
- [x] E2E test with screenshot for layout
- [x] All styling follows patterns from `ThemePreview.tsx`
- [x] DOM-first structure with semantic HTML and ARIA roles

---

## Styling Reference

All components will use Tailwind CSS classes as demonstrated in `ThemePreview.tsx`:
- Surfaces: `bg-app`, `bg-surface`, `bg-muted`
- Text: `text-primary`, `text-muted`, `text-inverse`
- Borders: `border-default`, `border-strong`
- Shadows: `shadow-card`, `shadow-popover`
- Radius: `rounded-card`, `rounded-button`, `rounded-control`
- Brand colors: `bg-brand-primary`, `text-brand-secondary`
- Status colors: `text-success`, `text-error`
- Controls: Tailwind utility classes for inputs, buttons, forms

---

## Out of Scope

- Application routing integration
- API integration
- Global state management
- Backend persistence
- Authentication/authorization
- Advanced filtering (status, date, etc.)
- Sorting
- Pagination
- Project editing
- Bulk operations
- Undo/redo

---

## Summary (Phase 2 Complete)

### Implementation Complete

All components, tests, library pages, and E2E tests have been successfully implemented.

### Final Prop Interfaces

All interfaces match the draft contracts exactly:

```ts
// types.ts
export interface Project {
  id: string;
  name: string;
  description: string;
}

export interface NewProjectData {
  name: string;
  description: string;
}

// ProjectsFilterProps, NewProjectFormProps, ProjectsListProps, ProjectsPageLayoutProps
// All implemented as drafted in the plan.
```

### Library Page URLs

| Component | URL |
|-----------|-----|
| ProjectsFilter | `/library/projects/filter?fixture=minimal\|rich` |
| NewProjectForm | `/library/projects/new-form?fixture=minimal\|rich` |
| ProjectsList | `/library/projects/list?fixture=minimal\|rich` |
| ProjectsPageLayout | `/library/projects/layout?fixture=minimal\|rich` |

### Files Created

**Components (13 files)**:
- `src/components/Projects/types.ts`
- `src/components/Projects/ProjectsFilter.tsx`
- `src/components/Projects/ProjectsFilter.fixture.ts`
- `src/components/Projects/ProjectsFilter.test.tsx`
- `src/components/Projects/NewProjectForm.tsx`
- `src/components/Projects/NewProjectForm.fixture.ts`
- `src/components/Projects/NewProjectForm.test.tsx`
- `src/components/Projects/ProjectsList.tsx`
- `src/components/Projects/ProjectsList.fixture.ts`
- `src/components/Projects/ProjectsList.test.tsx`
- `src/components/Projects/ProjectsPageLayout.tsx`
- `src/components/Projects/ProjectsPageLayout.fixture.ts`
- `src/components/Projects/ProjectsPageLayout.test.tsx`

**Library Pages (4 files)**:
- `src/library/projects/ProjectsFilter.tsx`
- `src/library/projects/NewProjectForm.tsx`
- `src/library/projects/ProjectsList.tsx`
- `src/library/projects/ProjectsPageLayout.tsx`

**E2E Tests (1 file)**:
- `e2e/tests/projects/ProjectsPageLayout.e2e.spec.ts`

**Screenshot Directory**:
- `e2e/screenshots/projects/ProjectsPageLayout/` (timestamp files created by E2E)

### How to Run

**Unit Tests**:
```bash
npm test -- --testPathPattern="src/components/Projects"
```

**E2E Tests** (requires dev server running):
```bash
npm run dev           # Start dev server
npx playwright test e2e/tests/projects/ProjectsPageLayout.e2e.spec.ts
```

**View Library Pages**:
```bash
npm run dev
# Then visit:
# http://localhost:5173/library/projects/layout?fixture=rich
```

### Test Coverage

All 49 unit tests pass with near 100% coverage:
- `NewProjectForm.tsx`: 100%
- `ProjectsFilter.tsx`: 100%
- `ProjectsList.tsx`: 100%
- `ProjectsPageLayout.tsx`: 100%

### Notes

- Routes added to `src/main.tsx` for library page access
- Barrel export updated in `src/components/Projects/index.ts`
- All styling follows `ThemePreview.tsx` patterns
- Components use semantic HTML with ARIA labels for accessibility
- Delete button uses `stopPropagation` to prevent row click

### Next Steps (Future Work)

- Wire to application page with real state management
- Connect to API for persistence
- Add sorting and advanced filtering
- Add project editing capability

