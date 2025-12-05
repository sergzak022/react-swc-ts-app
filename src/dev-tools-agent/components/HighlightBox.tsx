import type { HighlightRect } from '../types';

interface HighlightBoxProps {
  rect: HighlightRect | null;
}

/**
 * Highlight box overlay that shows the selected element boundaries.
 */
export function HighlightBox({ rect }: HighlightBoxProps) {
  if (!rect) {
    return null;
  }

  return (
    <div
      id="ui-agent-highlight-box"
      className="fixed pointer-events-none border-2 border-blue-500 rounded-sm z-[999997] transition-all duration-100 ease-out"
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3)',
      }}
    />
  );
}

