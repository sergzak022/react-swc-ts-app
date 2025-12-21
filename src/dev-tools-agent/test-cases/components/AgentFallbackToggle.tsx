import { useAgentFallback } from '../AgentFallbackContext';

export function AgentFallbackToggle() {
  const { enabled, setEnabled } = useAgentFallback();
  
  return (
    <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="w-5 h-5 text-yellow-600 focus:ring-yellow-500"
        />
        <div className="flex-1">
          <div className="font-semibold text-yellow-800">
            Enable Agent Fallback (Cursor CLI)
          </div>
          <div className="text-sm text-yellow-700 mt-1">
            ⚠️ Uses API credits. Only enable for manual testing. 
            Automated tests should keep this disabled.
          </div>
        </div>
      </label>
      {enabled && (
        <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-700 font-semibold">
          ⚠️ Agent fallback is ENABLED - API calls will be made when heuristics fail
        </div>
      )}
    </div>
  );
}

