import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

const STORAGE_KEY = 'ui-agent-use-agent-fallback';

interface AgentFallbackContextType {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const AgentFallbackContext = createContext<AgentFallbackContextType | undefined>(undefined);

/**
 * Provider component that manages agent fallback toggle state.
 * Uses localStorage to persist state across page reloads.
 * Default: disabled (false) to avoid API costs.
 */
export function AgentFallbackProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(() => {
    // Read from localStorage, default to false
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  });
  
  const handleSetEnabled = (value: boolean) => {
    setEnabled(value);
    localStorage.setItem(STORAGE_KEY, String(value));
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new CustomEvent('agentFallbackChange'));
  };
  
  return (
    <AgentFallbackContext.Provider value={{ enabled, setEnabled: handleSetEnabled }}>
      {children}
    </AgentFallbackContext.Provider>
  );
}

/**
 * Hook to access agent fallback state within provider context.
 */
export function useAgentFallback() {
  const context = useContext(AgentFallbackContext);
  if (!context) {
    // Return default (disabled) if context not available
    return { enabled: false, setEnabled: () => {} };
  }
  return context;
}

/**
 * Hook to read agent fallback state from localStorage.
 * Use this in components outside the provider (e.g., UI-Agent overlay).
 */
export function useAgentFallbackFromStorage(): boolean {
  const [enabled, setEnabled] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  });
  
  // Listen for storage changes (if toggle is on another page/tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setEnabled(e.newValue === 'true');
      }
    };
    
    // Also listen for custom event (same-tab updates)
    const handleCustomStorageChange = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      setEnabled(stored === 'true');
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('agentFallbackChange', handleCustomStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('agentFallbackChange', handleCustomStorageChange);
    };
  }, []);
  
  return enabled;
}

