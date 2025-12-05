/**
 * UI-Agent - Browser overlay for element inspection and AI-assisted code fixes.
 * 
 * Entry point for the dev tools agent overlay.
 */

import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { UiAgentOverlay } from './UiAgentOverlay';

let root: Root | null = null;
let container: HTMLDivElement | null = null;

/**
 * Initialize and mount the UI-Agent overlay.
 * Should only be called in development mode.
 */
export function initUiAgentOverlay(): void {
  if (root) {
    console.warn('[UI-Agent] Overlay already initialized');
    return;
  }

  // Create container element
  container = document.createElement('div');
  container.id = 'ui-agent-container';
  document.body.appendChild(container);

  // Create React root and render
  root = createRoot(container);
  root.render(createElement(UiAgentOverlay));

  console.log('[UI-Agent] Overlay mounted');
}

/**
 * Remove the UI-Agent overlay from the DOM.
 */
export function destroyUiAgentOverlay(): void {
  if (root) {
    root.unmount();
    root = null;
  }
  
  if (container) {
    container.remove();
    container = null;
  }

  console.log('[UI-Agent] Overlay unmounted');
}

// Export types for consumers
export type { SelectionPayload, HighlightRect, OverlayState } from './types';
