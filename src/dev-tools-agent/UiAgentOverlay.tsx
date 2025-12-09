import { useState, useCallback } from 'react';
import type { SelectionPayload, HighlightRect, ComponentContext } from './types';
import { FloatingButton } from './components/FloatingButton';
import { Panel } from './components/Panel';
import { HighlightBox } from './components/HighlightBox';
import { PickerLayer } from './components/PickerLayer';
import { resolveSelection } from './api';

const EXCLUDE_IDS = [
  'ui-agent-root',
  'ui-agent-floating-button',
  'ui-agent-panel',
  'ui-agent-highlight-box',
  'ui-agent-picker-layer',
];

/**
 * UI-Agent overlay component.
 * Manages the state and rendering of all overlay components.
 */
export function UiAgentOverlay() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isInSelectState, setIsInSelectState] = useState(false);
  const [payload, setPayload] = useState<SelectionPayload | null>(null);
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);
  const [componentContext, setComponentContext] = useState<ComponentContext | null>(null);

  const handleTogglePanel = useCallback(() => {
    if (isPanelOpen) {
      // Closing panel - disable selection mode
      setIsPanelOpen(false);
      setIsInSelectState(false);
      setPayload(null);
      setHighlightRect(null);
    } else {
      // Opening panel - enable selection mode automatically
      setIsPanelOpen(true);
      setIsInSelectState(true);
    }
  }, [isPanelOpen]);

  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false);
    setIsInSelectState(false);
    setPayload(null);
    setHighlightRect(null);
    setComponentContext(null);
  }, []);

  const handleHover = useCallback((rect: HighlightRect | null) => {
    setHighlightRect(rect);
  }, []);

  const handleSelect = useCallback((selectedPayload: SelectionPayload) => {
    setPayload(selectedPayload);
    setComponentContext(null); // Clear previous context
    console.log('[UI-Agent] Element selected:', selectedPayload);

    // Request component context from backend
    resolveSelection(selectedPayload)
      .then((ctx) => {
        setComponentContext(ctx);
        console.log('[UI-Agent] Component context resolved:', ctx);
      })
      .catch((err) => {
        console.error('[UI-Agent] Failed to resolve selection:', err);
      });
  }, []);

  return (
    <div id="ui-agent-root">
      {/* Highlight box - always rendered when there's a rect */}
      <HighlightBox rect={highlightRect} />

      {/* Picker layer - controlled by isInSelectState */}
      {isInSelectState && (
        <PickerLayer
          onHover={handleHover}
          onSelect={handleSelect}
          excludeIds={EXCLUDE_IDS}
        />
      )}

      {/* Floating panel - controlled by isPanelOpen */}
      {isPanelOpen && (
        <Panel
          payload={payload}
          componentContext={componentContext}
          onClose={handleClosePanel}
        />
      )}

      {/* Floating button - only when panel is closed */}
      {!isPanelOpen && (
        <FloatingButton onClick={handleTogglePanel} />
      )}
    </div>
  );
}

