/**
 * UI-Agent type definitions for element selection and payloads.
 */

export interface SelectionPayload {
  pageUrl: string;
  selector: string; // CSS selector string (e.g., '[data-testid="X"]', 'h1.class1.class2', '#id')
  domOuterHtml: string;
  textSnippet: string;
  classes: string[];
}

export interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface OverlayState {
  isPanelOpen: boolean;
  isInSelectState: boolean;
  selectedPayload: SelectionPayload | null;
  highlightRect: HighlightRect | null;
}

