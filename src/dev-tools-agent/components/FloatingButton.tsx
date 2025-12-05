interface FloatingButtonProps {
  onClick: () => void;
}

/**
 * Floating button that toggles the UI-Agent panel.
 */
export function FloatingButton({ onClick }: FloatingButtonProps) {
  return (
    <button
      id="ui-agent-floating-button"
      onClick={onClick}
      title="UI-Agent: Click to open panel and enter selection mode"
      className="fixed bottom-5 right-5 w-12 h-12 rounded-full bg-blue-500 text-white border-none cursor-pointer flex items-center justify-center shadow-lg z-[999999] transition-all duration-200 text-xl hover:scale-110 hover:bg-blue-600"
    >
      🎯
    </button>
  );
}

