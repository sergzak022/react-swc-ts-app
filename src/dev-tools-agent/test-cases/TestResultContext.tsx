import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { TestCase } from './TestCaseRegistry';
import type { TestResult, TestFilter, TestSummary, TestStatus } from './types';
import { runTest, runTests } from './TestRunner';
import { useAgentFallbackFromStorage } from './AgentFallbackContext';

const STORAGE_KEY = 'ui-agent-test-results';
const FILTER_STORAGE_KEY = 'ui-agent-test-filters';

interface TestResultContextValue {
  results: Map<string, TestResult>;
  resultsVersion: number;
  filter: TestFilter;
  summary: TestSummary;
  setFilter: (filter: Partial<TestFilter>) => void;
  runSingleTest: (testCase: TestCase) => Promise<void>;
  runMultipleTests: (testCases: TestCase[]) => Promise<void>;
  clearResults: () => void;
  clearTestResults: (testCaseIds: string[]) => void;
  isRunning: (testCaseId: string) => boolean;
  isAnyRunning: boolean;
  cancel: () => void;
}

const TestResultContext = createContext<TestResultContextValue | null>(null);

export function TestResultProvider({ children }: { children: React.ReactNode }) {
  const resultsRef = useRef<Map<string, TestResult>>(new Map());
  const [resultsVersion, setResultsVersion] = useState(0);
  const cancelledRef = useRef(false);
  
  const results = useMemo(() => {
    return new Map(resultsRef.current);
  }, [resultsVersion]);

  // Load initial state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed === 'object' && parsed !== null) {
          const validated = new Map<string, TestResult>();
          for (const [key, value] of Object.entries(parsed)) {
            if (value && typeof value === 'object' && 'testCaseId' in value && 'status' in value) {
              validated.set(key, {
                ...value as TestResult,
                warnings: (value as any).warnings || [],
                errors: (value as any).errors || [],
              });
            }
          }
          resultsRef.current = validated;
          setResultsVersion(v => v + 1);
        }
      }
    } catch (error) {
      console.error('Failed to load test results:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Filter state with URL persistence
  const [filter, setFilterState] = useState<TestFilter>(() => {
    const params = new URLSearchParams(window.location.search);
    const hasUrlParams = params.toString().length > 0;
    
    if (hasUrlParams) {
      return {
        categories: params.get('categories')?.split(',').filter(Boolean) || [],
        priorities: params.get('priorities')?.split(',').filter(Boolean) || [],
        tags: params.get('tags')?.split(',').filter(Boolean) || [],
        statuses: (params.get('statuses')?.split(',').filter(Boolean) || []) as TestStatus[],
        searchText: params.get('search') || '',
      };
    } else {
      try {
        const stored = localStorage.getItem(FILTER_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return { categories: [], priorities: [], tags: [], statuses: [], searchText: '' };
  });

  const setFilter = useCallback((newFilter: Partial<TestFilter>) => {
    setFilterState(prev => ({ ...prev, ...newFilter }));
  }, []);

  // URL sync effect
  useEffect(() => {
    const params = new URLSearchParams();
    if (filter.categories.length) params.set('categories', filter.categories.join(','));
    if (filter.priorities.length) params.set('priorities', filter.priorities.join(','));
    if (filter.tags.length) params.set('tags', filter.tags.join(','));
    if (filter.statuses.length) params.set('statuses', filter.statuses.join(','));
    if (filter.searchText) params.set('search', filter.searchText);
    
    const urlString = params.toString();
    if (urlString.length < 1000) {
      window.history.replaceState({}, '', urlString ? `?${urlString}` : window.location.pathname);
    } else {
      try {
        localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filter));
      } catch (error) {
        console.error('Failed to save filter state:', error);
      }
    }
  }, [filter]);

  // Debounced save to localStorage
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      try {
        const slimResults = Object.fromEntries(
          Array.from(resultsRef.current.entries()).map(([key, result]) => [
            key,
            { ...result, componentContext: undefined }
          ])
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slimResults));
      } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded, clearing old results');
          localStorage.removeItem(STORAGE_KEY);
          try {
            const essentialResults = Object.fromEntries(
              Array.from(resultsRef.current.entries()).map(([key, result]) => [
                key,
                {
                  testCaseId: result.testCaseId,
                  status: result.status,
                  duration: result.duration,
                  actualSelector: result.actualSelector,
                  actualFile: result.actualFile,
                  actualConfidence: result.actualConfidence,
                  actualSource: result.actualSource,
                  errors: result.errors,
                  warnings: result.warnings,
                  failureReason: result.failureReason,
                  startedAt: result.startedAt,
                  completedAt: result.completedAt,
                }
              ])
            );
            localStorage.setItem(STORAGE_KEY, JSON.stringify(essentialResults));
          } catch (retryError) {
            console.error('Failed to save after quota clear:', retryError);
          }
        } else {
          console.error('Failed to save test results:', error);
        }
      }
    }, 1000);
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [resultsVersion]);

  // Force save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      try {
        const slimResults = Object.fromEntries(
          Array.from(resultsRef.current.entries()).map(([key, result]) => [
            key,
            { ...result, componentContext: undefined }
          ])
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slimResults));
      } catch (error) {
        console.error('Failed to save on page unload:', error);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Test execution functions
  const updateResult = useCallback((result: TestResult) => {
    resultsRef.current.set(result.testCaseId, result);
    setResultsVersion(v => v + 1);
  }, []);

  const useAgentFallback = useAgentFallbackFromStorage();

  const runSingleTest = useCallback(async (testCase: TestCase) => {
    updateResult({
      testCaseId: testCase.id,
      status: 'running',
      errors: [],
      warnings: [],
      startedAt: Date.now(),
    });

    const result = await runTest(testCase, useAgentFallback, (status) => {
      updateResult({
        testCaseId: testCase.id,
        status,
        errors: [],
        warnings: [],
      });
    });

    updateResult(result);
  }, [useAgentFallback, updateResult]);

  const runMultipleTests = useCallback(async (testCases: TestCase[]) => {
    cancelledRef.current = false;

    testCases.forEach(testCase => {
      updateResult({
        testCaseId: testCase.id,
        status: 'pending',
        errors: [],
        warnings: [],
      });
    });

    await runTests(
      testCases,
      useAgentFallback,
      (result) => updateResult(result),
      (testCaseId, status) => {
        updateResult({ testCaseId, status, errors: [], warnings: [] });
      },
      () => cancelledRef.current
    );
  }, [useAgentFallback, updateResult]);

  // Helper functions
  const clearResults = useCallback(() => {
    resultsRef.current.clear();
    setResultsVersion(v => v + 1);
  }, []);

  const clearTestResults = useCallback((testCaseIds: string[]) => {
    testCaseIds.forEach(id => resultsRef.current.delete(id));
    setResultsVersion(v => v + 1);
  }, []);

  const isRunning = useCallback((testCaseId: string) => {
    const result = resultsRef.current.get(testCaseId);
    return result?.status === 'running';
  }, []);

  const isAnyRunning = useMemo(() => {
    return Array.from(resultsRef.current.values()).some(r => r.status === 'running');
  }, [resultsVersion]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  const summary = useMemo<TestSummary>(() => {
    const allResults = Array.from(resultsRef.current.values());
    return {
      total: allResults.length,
      passed: allResults.filter(r => r.status === 'passed').length,
      failed: allResults.filter(r => r.status === 'failed').length,
      running: allResults.filter(r => r.status === 'running').length,
      pending: allResults.filter(r => r.status === 'pending').length,
    };
  }, [resultsVersion]);

  const value: TestResultContextValue = {
    results,
    resultsVersion,
    filter,
    summary,
    setFilter,
    runSingleTest,
    runMultipleTests,
    clearResults,
    clearTestResults,
    isRunning,
    isAnyRunning,
    cancel,
  };

  return (
    <TestResultContext.Provider value={value}>
      {children}
    </TestResultContext.Provider>
  );
}

export function useTestResults() {
  const context = useContext(TestResultContext);
  if (!context) {
    throw new Error('useTestResults must be used within TestResultProvider');
  }
  return context;
}

