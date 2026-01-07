/**
 * UI-Agent type definitions for element selection and payloads.
 */

// Re-export shared types
export type { SelectionPayload, ComponentContext, TestIdInfo, SubmissionRequest, SubmissionResponse } from '../shared/types';

// Overlay-specific types (stay here)
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

// Import for use in OverlayState
import type { SelectionPayload } from '../shared/types';
