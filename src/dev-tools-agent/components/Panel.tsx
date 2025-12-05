import { useState, useCallback, useRef, useEffect } from 'react';
import type { SelectionPayload } from '../types';

interface PanelProps {
  payload: SelectionPayload | null;
  onClose: () => void;
}

interface Position {
  x: number;
  y: number;
}

const PANEL_WIDTH = 320;
const PANEL_HEIGHT = 500;
const DEFAULT_POSITION: Position = {
  x: window.innerWidth - PANEL_WIDTH - 20,
  y: 100,
};

/**
 * Draggable floating panel that displays the SelectionPayload JSON.
 */
export function Panel({ payload, onClose }: PanelProps) {
  const [position, setPosition] = useState<Position>(DEFAULT_POSITION);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef<Position>({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  /**
   * Constrain position to viewport bounds.
   */
  const constrainToViewport = useCallback((pos: Position): Position => {
    const maxX = window.innerWidth - PANEL_WIDTH;
    const maxY = window.innerHeight - 50; // Leave some space for header

    return {
      x: Math.max(0, Math.min(pos.x, maxX)),
      y: Math.max(0, Math.min(pos.y, maxY)),
    };
  }, []);

  /**
   * Handle mouse down on header to start dragging.
   */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start drag on left mouse button
    if (e.button !== 0) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    // Calculate offset from mouse to panel position
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  }, [position]);

  /**
   * Handle mouse move during drag.
   */
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newPosition = constrainToViewport({
        x: e.clientX - dragOffsetRef.current.x,
        y: e.clientY - dragOffsetRef.current.y,
      });
      setPosition(newPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    // Add listeners to document for smooth dragging even outside panel
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, constrainToViewport]);

  /**
   * Handle window resize to keep panel in bounds.
   */
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => constrainToViewport(prev));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [constrainToViewport]);

  return (
    <div
      ref={panelRef}
      id="ui-agent-panel"
      className="fixed bg-gray-800 text-gray-50 border border-gray-700 rounded-lg shadow-2xl z-[999999] flex flex-col font-sans overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        width: PANEL_WIDTH,
        maxHeight: PANEL_HEIGHT,
      }}
    >
      {/* Draggable Header */}
      <div
        className={`px-4 py-3 border-b border-gray-700 flex items-center justify-between select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <h2 className="m-0 text-base font-semibold">UI-Agent</h2>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          title="Close panel"
          className="bg-transparent border-none text-gray-50 cursor-pointer text-lg px-2 py-1 rounded transition-colors duration-200 hover:bg-white/10"
          onMouseDown={(e) => e.stopPropagation()} // Prevent drag when clicking close
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <p className="text-gray-50/70 mt-0 mb-3 text-sm">
          Click on any element to capture its details.
        </p>
        
        <pre className="bg-gray-900 p-3 rounded-md text-xs leading-relaxed overflow-auto whitespace-pre-wrap break-words font-mono m-0 max-h-80">
          {payload ? JSON.stringify(payload, null, 2) : 'No element selected'}
        </pre>
      </div>
    </div>
  );
}

