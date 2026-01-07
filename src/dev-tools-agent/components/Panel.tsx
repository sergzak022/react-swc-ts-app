import { useState, useCallback, useRef, useEffect } from 'react';
import type { SelectionPayload, ComponentContext, SubmissionResponse } from '../types';
import { submitToAgent } from '../api';

interface PanelProps {
  payload: SelectionPayload | null;
  componentContext: ComponentContext | null;
  onClose: () => void;
}

interface Position {
  x: number;
  y: number;
}

const MIN_PANEL_WIDTH = 300;
const MAX_PANEL_WIDTH = 800;
const DEFAULT_PANEL_WIDTH = 420;
const DEFAULT_POSITION: Position = {
  x: window.innerWidth - DEFAULT_PANEL_WIDTH - 20,
  y: 60,
};

/**
 * Draggable floating panel that displays the SelectionPayload JSON.
 */
export function Panel({ payload, componentContext, onClose }: PanelProps) {
  const [position, setPosition] = useState<Position>(DEFAULT_POSITION);
  const [width, setWidth] = useState<number>(DEFAULT_PANEL_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragOffsetRef = useRef<Position>({ x: 0, y: 0 });
  const resizeStartRef = useRef<{ x: number; width: number; positionX: number }>({ x: 0, width: 0, positionX: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResponse | null>(null);

  /**
   * Constrain position to viewport bounds.
   */
  const constrainToViewport = useCallback((pos: Position): Position => {
    const maxX = window.innerWidth - width;
    const maxY = window.innerHeight - 50;

    return {
      x: Math.max(0, Math.min(pos.x, maxX)),
      y: Math.max(0, Math.min(pos.y, maxY)),
    };
  }, [width]);

  /**
   * Constrain width to min/max bounds.
   */
  const constrainWidth = useCallback((w: number): number => {
    return Math.max(MIN_PANEL_WIDTH, Math.min(w, MAX_PANEL_WIDTH));
  }, []);

  /**
   * Handle mouse down on header to start dragging.
   */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;

    e.preventDefault();
    setIsDragging(true);

    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  }, [position]);

  /**
   * Handle mouse down on resize handle.
   */
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    resizeStartRef.current = {
      x: e.clientX,
      width: width,
      positionX: position.x,
    };
  }, [width, position.x]);

  /**
   * Handle mouse move during drag or resize.
   */
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newPosition = constrainToViewport({
          x: e.clientX - dragOffsetRef.current.x,
          y: e.clientY - dragOffsetRef.current.y,
        });
        setPosition(newPosition);
      } else if (isResizing) {
        const deltaX = resizeStartRef.current.x - e.clientX;
        const newWidth = constrainWidth(resizeStartRef.current.width + deltaX);
        setWidth(newWidth);

        // Calculate position from start to keep right edge in place
        const widthDelta = newWidth - resizeStartRef.current.width;
        setPosition((prev) => ({
          ...prev,
          x: resizeStartRef.current.positionX - widthDelta,
        }));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, constrainToViewport, constrainWidth]);

  /**
   * Handle window resize to keep panel in bounds.
   */
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => constrainToViewport(prev));
      // Ensure panel doesn't exceed viewport width
      setWidth((prev) => constrainWidth(Math.min(prev, window.innerWidth - 40)));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [constrainToViewport, constrainWidth]);

  // Sync verification state with componentContext
  useEffect(() => {
    if (componentContext) {
      setIsVerified(componentContext.verified);
      setUserMessage('');
      setSubmissionResult(null);
    }
  }, [componentContext]);

  // Handle verify button click
  const handleVerify = useCallback(() => {
    setIsVerified(true);
  }, []);

  // Handle submit button click
  const handleSubmit = useCallback(async () => {
    if (!componentContext || !isVerified || !userMessage.trim()) {
      return;
    }

    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      const result = await submitToAgent(
        { ...componentContext, verified: isVerified },
        userMessage.trim()
      );
      setSubmissionResult(result);
      console.log('[UI-Agent] Submission result:', result);
    } catch (error) {
      console.error('[UI-Agent] Submission failed:', error);
      setSubmissionResult({
        success: false,
        message: error instanceof Error ? error.message : 'Submission failed',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [componentContext, isVerified, userMessage]);

  return (
    <div
      ref={panelRef}
      id="ui-agent-panel"
      className="fixed bg-gray-800 text-gray-50 border border-gray-700 rounded-lg shadow-2xl z-[999999] flex flex-col font-sans"
      style={{
        left: position.x,
        top: position.y,
        width: width,
        maxHeight: 'calc(100vh - 120px)',
      }}
    >
      {/* Resize Handle */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500/50 transition-colors ${
          isResizing ? 'bg-blue-500' : ''
        }`}
        onMouseDown={handleResizeMouseDown}
        style={{ zIndex: 1 }}
      />

      {/* Draggable Header */}
      <div
        className={`px-4 py-3 border-b border-gray-700 flex items-center justify-between select-none flex-shrink-0 ${
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
          onMouseDown={(e) => e.stopPropagation()}
        >
          ✕
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        <p className="text-gray-50/70 mt-0 mb-3 text-sm">
          Click on any element to capture its details.
        </p>

        {/* Component Context Summary */}
        {componentContext && (
          <div className="mb-3 p-3 bg-gray-700 rounded-md text-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-gray-200">Component Context</span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  componentContext.confidence === 'high'
                    ? 'bg-green-600 text-green-100'
                    : componentContext.confidence === 'medium'
                    ? 'bg-yellow-600 text-yellow-100'
                    : 'bg-red-600 text-red-100'
                }`}
              >
                {componentContext.confidence}
              </span>
            </div>
            <div className="text-gray-300 space-y-1">
              <div>
                <span className="text-gray-400">filePath:</span>{' '}
                <span className="font-mono text-blue-300 text-xs break-all">{componentContext.filePath}</span>
              </div>
              {componentContext.lineNumber && (
                <div>
                  <span className="text-gray-400">line:</span>{' '}
                  <span className="font-mono">{componentContext.lineNumber}</span>
                </div>
              )}
              <div>
                <span className="text-gray-400">verified:</span>{' '}
                <span className={componentContext.verified ? 'text-green-400' : 'text-yellow-400'}>
                  {componentContext.verified ? 'yes' : 'no'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Code Snippet */}
        {componentContext?.codeSnippet && (
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1 font-medium">Source Code:</div>
            <div className="bg-gray-900 rounded-md overflow-hidden border border-gray-700">
              <div className="overflow-x-auto">
                <pre className="text-xs font-mono m-0 p-0">
                  {componentContext.codeSnippet.lines.map((line) => (
                    <div
                      key={line.lineNumber}
                      className={`flex hover:bg-gray-700/30 ${
                        line.isMatch ? 'bg-yellow-500/20 border-l-2 border-yellow-400' : ''
                      }`}
                    >
                      <span className="w-10 text-right pr-2 py-0.5 text-gray-500 select-none bg-gray-800/50 flex-shrink-0 border-r border-gray-700">
                        {line.lineNumber}
                      </span>
                      <code className="pl-2 py-0.5 whitespace-pre text-gray-300">{line.content || ' '}</code>
                    </div>
                  ))}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Action Section */}
        {componentContext && (
          <div className="mb-3 space-y-3">
            {/* Verify Button */}
            {!isVerified && (
              <div className="p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-md">
                <div className="text-xs text-yellow-200 mb-2">
                  ⚠️ This component mapping needs verification before submission.
                </div>
                <button
                  onClick={handleVerify}
                  className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
                >
                  ✓ Verify This Mapping
                </button>
              </div>
            )}

            {/* Message Input */}
            {isVerified && (
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-medium block">
                  What would you like to change?
                </label>
                <textarea
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  placeholder="Describe the change you want to make..."
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-200 placeholder-gray-500 resize-y min-h-[80px] focus:outline-none focus:border-blue-500"
                  disabled={isSubmitting}
                />
                
                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!userMessage.trim() || isSubmitting}
                  className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block animate-spin">⏳</span>
                      Submitting to Cursor Agent...
                    </>
                  ) : (
                    <>🚀 Submit to Cursor Agent</>
                  )}
                </button>
              </div>
            )}

            {/* Submission Result */}
            {submissionResult && (
              <div
                className={`p-3 rounded-md border ${
                  submissionResult.success
                    ? 'bg-green-900/30 border-green-700/50'
                    : 'bg-red-900/30 border-red-700/50'
                }`}
              >
                <div
                  className={`text-sm font-medium mb-1 ${
                    submissionResult.success ? 'text-green-200' : 'text-red-200'
                  }`}
                >
                  {submissionResult.success ? '✓ Success' : '✗ Failed'}
                </div>
                <div className="text-xs text-gray-300">{submissionResult.message}</div>
                {submissionResult.agentOutput && (
                  <details className="mt-2 group">
                    <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300 list-none flex items-center gap-1">
                      <span className="text-[10px] group-open:rotate-90 transition-transform">
                        ▶
                      </span>
                      Agent Output
                    </summary>
                    <pre className="mt-1 p-2 bg-gray-900 rounded text-xs text-gray-300 overflow-auto max-h-32 whitespace-pre-wrap">
                      {submissionResult.agentOutput}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        )}

        {/* Selection Payload JSON */}
        <details className="group">
          <summary className="text-xs text-gray-400 mb-1 font-medium cursor-pointer hover:text-gray-300 list-none flex items-center gap-1">
            <span className="text-[10px] group-open:rotate-90 transition-transform">▶</span>
            Selection Payload
          </summary>
          <pre className="bg-gray-900 p-3 rounded-md text-xs leading-relaxed overflow-auto whitespace-pre-wrap break-words font-mono m-0 mt-1 max-h-48 border border-gray-700">
            {payload ? JSON.stringify(payload, null, 2) : 'No element selected'}
          </pre>
        </details>
      </div>
    </div>
  );
}
