# Project Management Component Library — Files

**Date**: 2025-11-21  
**Status**: Planning

---

## Files to Create

All paths are absolute from workspace root.

### Leaf Components

#### ProjectsList

- `/Users/sergeyz/Documents/misc/code/react-swc-ts-app/src/components/projects/ProjectsList.tsx`
- `/Users/sergeyz/Documents/misc/code/react-swc-ts-app/src/components/projects/ProjectsList.test.tsx`
- `/Users/sergeyz/Documents/misc/code/react-swc-ts-app/src/components/projects/ProjectsList.fixture.ts`

#### ProjectsFilter

- `/Users/sergeyz/Documents/misc/code/react-swc-ts-app/src/components/projects/ProjectsFilter.tsx`
- `/Users/sergeyz/Documents/misc/code/react-swc-ts-app/src/components/projects/ProjectsFilter.test.tsx`
- `/Users/sergeyz/Documents/misc/code/react-swc-ts-app/src/components/projects/ProjectsFilter.fixture.ts`

#### NewProjectForm

- `/Users/sergeyz/Documents/misc/code/react-swc-ts-app/src/components/projects/NewProjectForm.tsx`
- `/Users/sergeyz/Documents/misc/code/react-swc-ts-app/src/components/projects/NewProjectForm.test.tsx`
- `/Users/sergeyz/Documents/misc/code/react-swc-ts-app/src/components/projects/NewProjectForm.fixture.ts`

### Layout Component

- `/Users/sergeyz/Documents/misc/code/react-swc-ts-app/src/components/projects/ProjectsPageLayout.tsx`
- `/Users/sergeyz/Documents/misc/code/react-swc-ts-app/src/components/projects/ProjectsPageLayout.test.tsx`
- `/Users/sergeyz/Documents/misc/code/react-swc-ts-app/src/components/projects/ProjectsPageLayout.fixture.ts`

### Barrel Export

- `/Users/sergeyz/Documents/misc/code/react-swc-ts-app/src/components/projects/index.ts`

### Library Pages (Dev-Only)

- `/Users/sergeyz/Documents/misc/code/react-swc-ts-app/src/library/projects/ProjectsList.tsx`
- `/Users/sergeyz/Documents/misc/code/react-swc-ts-app/src/library/projects/ProjectsFilter.tsx`
- `/Users/sergeyz/Documents/misc/code/react-swc-ts-app/src/library/projects/NewProjectForm.tsx`
- `/Users/sergeyz/Documents/misc/code/react-swc-ts-app/src/library/projects/ProjectsPageLayout.tsx`

### E2E Tests

- `/Users/sergeyz/Documents/misc/code/react-swc-ts-app/e2e/tests/projects/ProjectsPageLayout.e2e.spec.ts`

### E2E Screenshots (Created by Test)

- `/Users/sergeyz/Documents/misc/code/react-swc-ts-app/e2e/screenshots/projects/ProjectsPageLayout/` (directory, timestamp file created by E2E)

### Planning Docs (Already Created)

- `/Users/sergeyz/Documents/misc/code/react-swc-ts-app/docs/plans/presentation/2025-11-21/project-management/plan.md`
- `/Users/sergeyz/Documents/misc/code/react-swc-ts-app/docs/plans/presentation/2025-11-21/project-management/files.md`
- `/Users/sergeyz/Documents/misc/code/react-swc-ts-app/docs/plans/presentation/2025-11-21/project-management/notes.md`

---

## Total Count

- **Leaf Components**: 3 (9 files: tsx, test, fixture each)
- **Layout Component**: 1 (3 files: tsx, test, fixture)
- **Barrel Export**: 1 file
- **Library Pages**: 4 files
- **E2E Tests**: 1 spec file
- **E2E Screenshots**: 1 directory (files created at runtime)
- **Planning Docs**: 3 files

**Grand Total**: 22 files + 1 screenshot directory

---

## Module Organization

```
src/components/projects/
  ├── index.ts                      (barrel export)
  ├── ProjectsList.tsx
  ├── ProjectsList.test.tsx
  ├── ProjectsList.fixture.ts
  ├── ProjectsFilter.tsx
  ├── ProjectsFilter.test.tsx
  ├── ProjectsFilter.fixture.ts
  ├── NewProjectForm.tsx
  ├── NewProjectForm.test.tsx
  ├── NewProjectForm.fixture.ts
  ├── ProjectsPageLayout.tsx
  ├── ProjectsPageLayout.test.tsx
  └── ProjectsPageLayout.fixture.ts

src/library/projects/
  ├── ProjectsList.tsx
  ├── ProjectsFilter.tsx
  ├── NewProjectForm.tsx
  └── ProjectsPageLayout.tsx

e2e/tests/projects/
  └── ProjectsPageLayout.e2e.spec.ts

e2e/screenshots/projects/ProjectsPageLayout/
  └── (timestamped PNG files created by E2E)

docs/plans/presentation/2025-11-21/project-management/
  ├── plan.md
  ├── files.md
  └── notes.md
```

