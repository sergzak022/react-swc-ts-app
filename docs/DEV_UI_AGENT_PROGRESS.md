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
