# Projects Management UI — Planning (Phase 1)

## Intent
Build a small library of leaf components and one layout to manage projects in a dev-only harness: filter projects by name, view a list, delete an item, and add a new project via a local form. The library page will demonstrate behavior deterministically with local state only (no APIs, no global state).

## Acceptance Criteria
- Filtering by name updates the visible list immediately without side effects or data fetching.
- Clicking a row triggers an `onRowClick(projectId)` callback.
- Each row includes an X button to delete; clicking it triggers `onDelete(projectId)` and does not trigger row click.
- Submitting the “new project” form raises `onSubmit({ name, description })`. In the library page harness, the new project appears in the list.
- Visual style follows ThemePreview patterns (spacing, borders, radii, elevation, color semantics), but implemented via CSS Modules consuming semantic CSS variables only (var(--...)).
- Leaf components remain pure UI units: typed props, DOM, and local-only logic as needed.
- Layout composes leaves and forwards prop objects without reshaping.
- Unit tests reach 100% for touched files and use fixtures.
- Library pages expose deterministic fixtures via `?fixture=minimal|rich`.

## Components
- Leaf: `ProjectsList`
  - Purpose: Render a simple list of projects with clickable rows and an inline X delete button per row.
- Leaf: `ProjectsListFilter`
  - Purpose: A single text input to filter by name.
- Leaf: `NewProjectForm`
  - Purpose: Controlled or internally-managed form for new project name and description; emits one submit callback.
- Layout: `ProjectsPage.layout`
  - Purpose: Compose `ProjectsListFilter`, `ProjectsList`, and `NewProjectForm`. No new logic; prop-object forwarding only.

## Draft Prop Contracts (TypeScript)
```ts
// Domain shape used by the leaves; kept minimal for UI needs only
export interface ProjectItem {
  id: string;
  name: string;
  description: string;
}

// ProjectsList
export interface ProjectsListProps {
  projects: ProjectItem[];
  onRowClick: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  /** Optional ARIA label for the list container */
  ariaLabel?: string;
}

// ProjectsListFilter (name-only filter)
export interface ProjectsListFilterProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}

// NewProjectForm
export interface NewProjectFormProps {
  onSubmit: (input: { name: string; description: string }) => void;
  initialName?: string;
  initialDescription?: string;
  submitLabel?: string; // default: "Create"
  ariaLabel?: string;
}

// Layout prop-object forwarding (no reshaping)
export interface ProjectsPageLayoutProps {
  projectsListFilter: ProjectsListFilterProps;
  projectsList: ProjectsListProps;
  newProjectForm: NewProjectFormProps;
}
```

## Structure & Interaction Notes
- ProjectsList row is clickable via button semantics or role; the delete X inside the row stops propagation to avoid firing `onRowClick`.
- Filter is a single input; case-insensitive contains match on `name` in the harness.
- NewProjectForm uses basic validation: non-empty `name`. Error presentation is local to the leaf UI.

## Styling Plan (CSS Modules using semantic tokens)
- Use CSS variables via `var(--...)` for colors, borders, and shadows.
- Mirror ThemePreview’s patterns for surfaces, borders, spacing, rounded corners, and elevations:
  - Cards/surfaces: app vs surface backgrounds
  - Borders: default/strong as needed
  - Radii: `rounded-card`, `rounded-button` analogs via module classes
  - Shadows: subtle card elevation for list and form containers
- No hardcoded color values; no theme primitives imported directly.

## Tests
- Unit tests for all three leaves and the layout.
  - Leaves: render minimal and rich fixtures, callbacks fire, error state on form invalid submit is rendered (if present).
  - Layout: verifies prop-object forwarding only (no derived logic).
- 100% coverage for touched files using fixtures.

## Library Pages & URLs
- `src/library/projects/ProjectsList.tsx` → `/library/projects/ProjectsList?fixture=minimal|rich`
- `src/library/projects/ProjectsPage.layout.tsx` → `/library/projects/ProjectsPage.layout?fixture=minimal|rich`
  - Harness owns demo state: list of projects, filter value, and add/delete actions. Filtering is local and synchronous.

## E2E (planned)
- Specs:
  - `tests/e2e/projects/ProjectsList.e2e.spec.ts`: smoke interactions (row click, delete button).
  - `tests/e2e/projects/ProjectsPage.layout.e2e.spec.ts`: filter, add new project, delete.
- One meaningful interaction per spec with a timestamped PNG saved under:
  - `tests/e2e/projects/ProjectsPage.layout/<ISO_TIMESTAMP>.png`

## Theme Check
- All component styles use CSS Modules with semantic CSS variables only (`var(--fg-primary)`, `var(--bg-surface)`, etc.).
- No global theme edits, no token changes, no Tailwind class additions in these components.


