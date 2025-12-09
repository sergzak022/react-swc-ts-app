import { useCallback, useRef, useEffect, useMemo } from 'react';
import type { SelectionPayload, HighlightRect, TestIdInfo } from '../types';
import { deepElementFromPoint } from '../utils/deepElementFromPoint';
import { buildSelector } from '../utils/buildSelector';
import { throttle } from '../utils/throttle';

/**
 * Find data-testid on element or nearest ancestor.
 * Returns structured info about where it was found.
 */
function findTestIdInfo(element: Element): TestIdInfo | null {
  let current: Element | null = element;
  let depth = 0;

  while (current) {
    const testId = current.getAttribute('data-testid');
    if (testId) {
      return {
        value: testId,
        onSelf: depth === 0,
        depth,
        ancestorTagName: current.tagName.toLowerCase(),
      };
    }
    current = current.parentElement;
    depth++;
  }

  return null;
}

interface PickerLayerProps {
  onHover: (rect: HighlightRect | null) => void;
  onSelect: (payload: SelectionPayload) => void;
  excludeIds: string[];
}

/**
 * Full-screen picker layer that detects elements on hover and click.
 */
export function PickerLayer({ onHover, onSelect, excludeIds }: PickerLayerProps) {
  const lastHoveredElementRef = useRef<Element | null>(null);
  const lastMousePositionRef = useRef<{ x: number; y: number } | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  /**
   * Check if an element is part of our overlay UI.
   */
  const isOverlayElement = useCallback((element: Element): boolean => {
    return excludeIds.some(id => {
      const overlayEl = document.getElementById(id);
      return overlayEl && (overlayEl === element || overlayEl.contains(element));
    });
  }, [excludeIds]);

  /**
   * Get the actual element under the picker layer.
   */
  const getElementUnderPoint = useCallback((x: number, y: number): Element | null => {
    const layer = layerRef.current;
    if (!layer) return null;

    // Temporarily hide the picker layer to get the element underneath
    layer.style.pointerEvents = 'none';
    const element = deepElementFromPoint(x, y);
    layer.style.pointerEvents = 'all';

    if (element && isOverlayElement(element)) {
      return null;
    }

    return element;
  }, [isOverlayElement]);

  /**
   * Build a SelectionPayload from an element.
   */
  const buildPayload = useCallback((element: Element): SelectionPayload => {
    const selector = buildSelector(element);
    const testId = findTestIdInfo(element);

    return {
      pageUrl: window.location.href,
      selector,
      testId,
      domOuterHtml: element.outerHTML.slice(0, 1000),
      textSnippet: (element.textContent || '').trim().slice(0, 100),
      classes: Array.from(element.classList),
    };
  }, []);

  /**
   * Update highlight for element at given position.
   */
  const updateHighlightAtPosition = useCallback((x: number, y: number) => {
    const element = getElementUnderPoint(x, y);

    if (element === lastHoveredElementRef.current) {
      return;
    }

    lastHoveredElementRef.current = element;

    if (element) {
      const rect = element.getBoundingClientRect();
      onHover({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    } else {
      onHover(null);
    }
  }, [getElementUnderPoint, onHover]);

  /**
   * Throttled version of updateHighlightAtPosition (300ms).
   */
  const throttledUpdateHighlight = useMemo(
    () => throttle(updateHighlightAtPosition, 300),
    [updateHighlightAtPosition]
  );

  /**
   * Handle mouse move for hover highlighting.
   */
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const x = e.clientX;
    const y = e.clientY;
    
    // Store last mouse position for scroll updates
    lastMousePositionRef.current = { x, y };
    
    // Use throttled version to reduce jumping
    throttledUpdateHighlight(x, y);
  }, [throttledUpdateHighlight]);

  /**
   * Handle click for selection.
   */
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const element = getElementUnderPoint(e.clientX, e.clientY);

    if (element) {
      const payload = buildPayload(element);
      onSelect(payload);
    }
  }, [getElementUnderPoint, buildPayload, onSelect]);

  /**
   * Handle mouse leave.
   */
  const handleMouseLeave = useCallback(() => {
    lastHoveredElementRef.current = null;
    lastMousePositionRef.current = null;
    onHover(null);
  }, [onHover]);

  /**
   * Handle scroll events to update highlight when scrolling moves cursor over different elements.
   */
  useEffect(() => {
    const handleScroll = () => {
      // Only update if we have a last known mouse position
      if (!lastMousePositionRef.current) return;

      const { x, y } = lastMousePositionRef.current;
      // Use throttled version to reduce jumping
      throttledUpdateHighlight(x, y);
    };

    // Listen to scroll events on window and document with capture phase
    // to catch scroll events on nested scrollable elements
    window.addEventListener('scroll', handleScroll, true);
    document.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [throttledUpdateHighlight]);

  return (
    <div
      ref={layerRef}
      id="ui-agent-picker-layer"
      className="fixed top-0 left-0 w-screen h-screen bg-transparent z-[999998] cursor-pointer"
      style={{ pointerEvents: 'all' }}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onMouseLeave={handleMouseLeave}
    />
  );
}

