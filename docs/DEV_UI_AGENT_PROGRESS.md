# UI-Agent Progress Document

## Project Overview

UI-Agent is a developer tool that lets you:

1. Open your running web app.
2. Click any UI element.
3. Automatically resolve which source file/component rendered it.
4. Confirm visually if the mapping is correct.
5. Send that verified context plus a natural language message to an AI agent (Cursor) which fixes the code.

The MVP is intentionally minimal and pragmatic.

**Non-goals:**
- No design tooling
- No QA systems
- No E2E tests yet
- No Electron
- No design systems
- No preview environments
- No build-time transforms
- No devtools hooks
- No AST parsing
- No test runners
- No multi-agent systems

Everything runs as:
- A browser overlay
- A Node backend
- Cursor CLI

We only add complexity if real usage proves it is necessary.

---

## Milestone 1 — Overlay + Element Capturing

**Status:** Complete

### Goal

Build a browser overlay that:
- Injects into the dev app.
- Renders a floating button and side panel.
- When panel is open, enables a full-screen pick layer.
- Uses `elementFromPoint` to detect the real DOM element.
- Supports open shadow DOM.
- Highlights the selected element visually.
- Builds a `SelectionPayload` object.
- Displays the `SelectionPayload` as formatted JSON.

### Current Implementation Notes

**Implementation:** React functional components with Tailwind CSS

**Files Created:**

- `src/dev-tools-agent/index.ts` - Entry point, exports `initUiAgentOverlay()` and `destroyUiAgentOverlay()`
- `src/dev-tools-agent/types.ts` - Type definitions: `SelectionPayload`, `SelectorType`, `HighlightRect`, `OverlayState`
- `src/dev-tools-agent/UiAgentOverlay.tsx` - Main React overlay component with state management
- `src/dev-tools-agent/utils/deepElementFromPoint.ts` - Recursive shadow DOM traversal
- `src/dev-tools-agent/utils/buildSelector.ts` - Selector construction (data-testid or CSS fallback)
- `src/dev-tools-agent/components/FloatingButton.tsx` - React toggle button component
- `src/dev-tools-agent/components/Panel.tsx` - React draggable floating panel with JSON display
- `src/dev-tools-agent/components/PickerLayer.tsx` - React full-screen picker layer with hooks
- `src/dev-tools-agent/components/HighlightBox.tsx` - React element highlight overlay

**Main Functions:**

- `initUiAgentOverlay()` - Initializes and mounts the overlay
- `destroyUiAgentOverlay()` - Removes the overlay from DOM
- `deepElementFromPoint(x, y)` - Finds deepest element including shadow DOM
- `buildSelector(element)` - Builds selector with data-testid preference

**Where Overlay is Initialized:**

In `src/main.tsx`, inside the development mode block after `runApp()`:

```typescript
if (import.meta.env.MODE === 'development') {
  import('./mocks/browser').then(({ start, populateData }) => {
    populateData()
    start()
    runApp()
    
    // Initialize UI-Agent overlay
    import('./dev-tools-agent').then(({ initUiAgentOverlay }) => {
      initUiAgentOverlay()
    })
  })
}
```

**How Picking Works:**

1. User clicks the floating button (🎯) in the bottom-right corner.
2. Draggable floating panel opens, picker layer activates (full-screen transparent overlay).
3. Panel can be dragged anywhere on screen by grabbing the header.
3. As user moves cursor, `mousemove` event triggers:
   - Picker layer temporarily disables `pointer-events`
   - `deepElementFromPoint()` finds the element under cursor (traversing shadow DOMs)
   - Highlight box updates position to match element's `getBoundingClientRect()`
4. On click:
   - `buildSelector()` creates selector (prefers `data-testid`, falls back to CSS)
   - `SelectionPayload` is built with: pageUrl, selector, domOuterHtml, textSnippet, classes
   - JSON is displayed in the side panel
5. User can close panel via the ✕ button.

### How to Test

**Basic Functionality:**

1. Run `npm start`
2. Open browser at `http://localhost:5173` (or the port shown in terminal)
3. Look for the floating button (🎯) in the bottom-right corner
4. Click the floating button
5. Side panel opens on the right, picker mode activates
6. Hover over any element - cursor becomes pointer, element highlights with blue border
7. Move cursor - highlight follows smoothly
8. Click an element - highlight persists, JSON appears in the side panel
9. Verify JSON contains:
   - `pageUrl`: current URL
   - `selector`: object with `type` ("data-testid" or "css") and `value`
   - `domOuterHtml`: first 1000 chars of element's outer HTML
   - `textSnippet`: first 100 chars of text content
   - `classes`: array of CSS classes
10. Click ✕ to close the panel and return to normal mode

**Shadow DOM Testing:**

*(Note: No shadow DOM components exist in the current codebase. This will be tested when shadow DOM test components are added.)*

1. Navigate to `/dev-tools-agent/test-shadow-dom` (when available)
2. Open UI-Agent overlay
3. Hover over elements in open shadow root - should highlight correctly
4. Click element in open shadow root - verify selector and payload are correct
5. Test nested shadow roots
6. Test closed shadow roots - verify graceful handling

---

## Milestone 2 — Backend Skeleton + /resolve-selection Wiring

**Status:** Complete

### Goal

Add a Node backend and connect the overlay to it. Resolution is still stubbed — we only prove wiring.

- Create a backend server with `/health` and `/resolve-selection` routes.
- Make overlay send `SelectionPayload` to backend on element pick.
- Display returned `ComponentContext` in overlay UI.

### Current Implementation Notes

**Backend:** Express server at `server/index.ts`, listening on port 4000.

**Routes:**

- `GET /health` → `{ ok: true }`
- `POST /resolve-selection` → returns stub `ComponentContext`:
  - `id`: UUID
  - `source`: `'heuristic'`
  - `confidence`: `'medium'`
  - `filePath`: `'src/App.tsx'` (stub)
  - `componentName`: `'App'`
  - `lineNumber`: `10`
  - `selectorSummary`: echoes `payload.selector`
  - `domSummary`: echoes `payload.textSnippet`
  - `needsVerification`: `true`
  - `verified`: `false`

**Files Created/Modified:**

- `server/index.ts` - Express backend with `/health` and `/resolve-selection`
- `src/dev-tools-agent/types.ts` - Added `ComponentContext` interface
- `src/dev-tools-agent/api.ts` - `resolveSelection()` helper to POST to backend
- `src/dev-tools-agent/UiAgentOverlay.tsx` - Calls `resolveSelection()` on pick, passes context to Panel
- `src/dev-tools-agent/components/Panel.tsx` - Displays `ComponentContext` summary (filePath, confidence, verified)

**Dependencies Added:**

- `express`, `cors` (runtime)
- `@types/express`, `@types/cors`, `tsx` (dev)

**npm Scripts:**

- `dev:server` - Runs the backend with `tsx server/index.ts`

### How to Test

**Backend (curl):**

```bash
# Health check
curl http://localhost:4000/health
# Expected: {"ok":true}

# Resolve selection (stub)
curl -X POST http://localhost:4000/resolve-selection \
  -H "Content-Type: application/json" \
  -d '{"pageUrl":"http://localhost:5173","selector":"h1","domOuterHtml":"<h1>Hi</h1>","textSnippet":"Hi","classes":[]}'
# Expected: {"componentContext":{"id":"...","source":"heuristic","confidence":"medium","filePath":"src/App.tsx",...}}
```

**Browser Flow:**

1. Start backend: `npm run dev:server` (listens on port 4000)
2. Start frontend: `npm start` (Vite dev server)
3. Open browser at `http://localhost:5173` (or port shown)
4. Click the floating button (🎯) to open the overlay
5. Pick any element
6. Panel shows:
   - Selection JSON (as before)
   - Component Context summary: filePath, component, line, confidence badge, verified status
7. Console logs `[UI-Agent] Component context resolved: {...}`

---

## Milestone 3 — data-testid Heuristic Resolution

**Status:** Complete

### Goal

Resolve `data-testid` attributes to source files using file search.

### Implementation Notes

**Architecture:**
- Shared types in `src/shared/types.ts` for FE/BE consistency
- Frontend extracts structured `TestIdInfo` (value, onSelf, depth, ancestorTagName)
- Backend uses resolver chain pattern for extensibility
- Uses `fast-glob` + `fs.readFile` for portable file search (no external binaries)

**Resolver Chain:**
- Resolvers are tried in order until one returns a result
- Each resolver returns `null` if it cannot handle the payload
- To add new resolvers: create file, add to `resolvers` array in `server/resolvers/index.ts`

**TestId Resolver - Two-Phase Search:**
1. Direct literal: `data-testid="value"`
2. Constant pattern: find `const X = 'value'`, then `data-testid={X}`

**Confidence Logic:**
- No testId or 0 matches → `low`, not verified
- 1 match, testId on self or depth ≤ 2 → `high`, verified
- 1 match, testId on distant ancestor (depth > 2) → `medium`, not verified
- Multiple matches, same file → `medium`, not verified
- Multiple matches, different files → `low`, not verified

**Files Created:**
- `src/shared/types.ts` - Shared type definitions (`SelectionPayload`, `ComponentContext`, `TestIdInfo`)
- `server/resolvers/types.ts` - Resolver types (`ResolutionResult`, `ResolverOptions`, `ResolverFn`)
- `server/resolvers/testIdResolver.ts` - TestId resolution logic with two-phase search
- `server/resolvers/index.ts` - Resolver chain orchestration

**Files Modified:**
- `src/dev-tools-agent/types.ts` - Re-exports shared types
- `src/dev-tools-agent/components/PickerLayer.tsx` - Extracts `TestIdInfo` from DOM
- `server/index.ts` - Thin controller using resolver chain
- `package.json` - Added `fast-glob` dependency

**Dependencies Added:**
- `fast-glob` (runtime)

### How to Add a New Resolver

1. Create `server/resolvers/newResolver.ts`:
   ```typescript
   import type { ResolverFn } from './types';

   export const newResolver: ResolverFn = async (payload, options) => {
     if (!canHandle(payload)) {
       return null;
     }
     // Resolution logic...
     return { confidence, verified, filePath, lineNumber };
   };
   ```

2. Add to chain in `server/resolvers/index.ts`:
   ```typescript
   const resolvers: ResolverFn[] = [
     testIdResolver,
     newResolver,  // Add here in priority order
   ];
   ```

### How to Test

**Backend (curl):**

```bash
npm run dev:server

# Test with testId (constant pattern - matches your codebase)
curl -X POST http://localhost:4000/resolve-selection \
  -H "Content-Type: application/json" \
  -d '{
    "testId": {"value": "Project-list", "onSelf": true, "depth": 0, "ancestorTagName": "ul"},
    "selector": "[data-testid=\"Project-list\"]",
    "textSnippet": "Projects"
  }'
# Expected: filePath points to src/components/Projects/Projects.tsx

# Test without testId (should return low confidence)
curl -X POST http://localhost:4000/resolve-selection \
  -H "Content-Type: application/json" \
  -d '{
    "testId": null,
    "selector": "div.my-class",
    "textSnippet": "Hello"
  }'
```

**Browser Flow:**

1. Start backend: `npm run dev:server`
2. Start frontend: `npm start`
3. Click floating button (🎯) to open overlay
4. Click element with `data-testid` (e.g., in Projects page)
5. Panel shows:
   - `filePath`: actual source file (e.g., `src/components/Projects/Projects.tsx`)
   - `lineNumber`: line where `data-testid` is used
   - `confidence`: green "high" badge for direct matches
   - `verified`: "yes" for high-confidence matches
6. Console logs show resolution details

---

## Milestone 3.1 — Code Snippet Display

**Status:** Complete

### Goal

Display source code around the matched line in the Panel for visual verification.

### Implementation Notes

**Features Added:**
- Extract 10 lines above and below the matched line
- Display code with line numbers in a scrollable container
- Highlight the matched line with yellow background and left border
- Fixed panel scrolling (content now scrolls properly)
- Collapsed Selection Payload JSON into expandable `<details>` element
- Widened panel from 320px to 420px to accommodate code

**Types Added:**
- `CodeLine` - Single line with `lineNumber`, `content`, `isMatch`
- `CodeSnippet` - Collection of lines with `startLine`, `endLine`, `matchLine`
- Added `codeSnippet?: CodeSnippet` to `ComponentContext` and `ResolutionResult`

**Files Modified:**
- `src/shared/types.ts` - Added `CodeLine`, `CodeSnippet` types
- `server/resolvers/types.ts` - Added `codeSnippet` to `ResolutionResult`
- `server/resolvers/testIdResolver.ts` - Added `extractCodeSnippet()` helper
- `server/index.ts` - Pass `codeSnippet` to response
- `src/dev-tools-agent/components/Panel.tsx` - Code snippet display, fixed scrolling

### How to Test

1. Start backend: `npm run dev:server`
2. Start frontend: `npm start`
3. Click floating button (🎯) to open overlay
4. Click element with `data-testid`
5. Panel shows:
   - Component context (filePath, line, confidence, verified)
   - **Source Code section** with 21 lines (10 above, matched line, 10 below)
   - Matched line highlighted in yellow
   - Line numbers on the left
   - Selection Payload collapsed by default (click to expand)
