# Test Runner Implementation Guide

**Purpose**: Step-by-step implementation guide for AI agents to implement test runner enhancements.

**Prerequisites**:
- Test cases page exists at `/dev-tools-agent/test-cases`
- Resolver API available at `http://localhost:4000`
- `AgentFallbackContext` exists
- `buildSelector` function exists in `src/dev-tools-agent/utils/buildSelector.ts`
- `resolveSelection` API exists in `src/dev-tools-agent/api.ts`

---

## Implementation Phases

**⚠️ CRITICAL**: Complete Phase 0 AND Phase 0.5 before starting Phase 1!

- **Phase 0**: Critical Pre-Implementation Fixes (3 steps)
- **Phase 0.5**: Additional Critical Fixes (5 steps)
- **Phase 1**: Foundation - Types and Core Infrastructure (8 steps)
- **Phase 2**: State Management (8 steps)
- **Phase 3**: UI Components (10 steps)
- **Phase 4**: Test Case Updates (7 steps)
- **Phase 5**: Testing and Validation (7 steps)
- **Phase 6**: Polish and Documentation (4 steps)

---

## Phase 0: Critical Pre-Implementation Fixes

### Step 0.1: Implement Semantic Selector Comparison
**File**: `src/dev-tools-agent/test-cases/TestRunner.ts` (NEW - create file first)

Add this function:

```typescript
function areSelectorsEquivalent(
  selector1: string | null,
  selector2: string | null,
  originalElement?: Element
): boolean {
  if (!selector1 && !selector2) return true;
  if (!selector1 || !selector2) return false;
  if (selector1.trim() === selector2.trim()) return true;
  
  // Validate against original element if provided
  if (originalElement && selector2) {
    try {
      const matches = document.querySelectorAll(selector2);
      if (!Array.from(matches).includes(originalElement)) {
        return false;
      }
    } catch {
      // Fall through
    }
  }
  
  try {
    const elements1 = document.querySelectorAll(selector1);
    const elements2 = document.querySelectorAll(selector2);
    if (elements1.length !== elements2.length) return false;
    if (elements1.length === 0) {
      try {
        document.querySelector(selector1);
        document.querySelector(selector2);
        return true;
      } catch {
        return false;
      }
    }
    const set1 = new Set(Array.from(elements1));
    const set2 = new Set(Array.from(elements2));
    if (set1.size !== set2.size) return false;
    for (const el of set1) {
      if (!set2.has(el)) return false;
    }
    return true;
  } catch {
    return selector1.trim() === selector2.trim();
  }
}
```

**Verification**: Function compiles and can be called.

---

### Step 0.2: Implement File Path Normalization
**File**: `src/dev-tools-agent/test-cases/TestRunner.ts` (MODIFY)

Add this function:

```typescript
function normalizeFilePath(filePath: string | null | undefined): string | null {
  if (!filePath) return null;
  let normalized = filePath.replace(/^\.\//, '');
  normalized = normalized.replace(/\\/g, '/');
  normalized = normalized.replace(/\/$/, '');
  return normalized;
}
```

**Verification**: Function compiles and handles various path formats.

---

### Step 0.3: Optimize React State Management Pattern
**File**: `src/dev-tools-agent/test-cases/TestResultContext.tsx` (NEW - create file structure)

Set up ref-based state management pattern:

```typescript
const resultsRef = useRef<Map<string, TestResult>>(new Map());
const [resultsVersion, setResultsVersion] = useState(0);

const results = useMemo(() => {
  return new Map(resultsRef.current);
}, [resultsVersion]);
```

**Verification**: File compiles, pattern is ready for use.

---

## Phase 0.5: Additional Critical Fixes

### Step 0.5.1: Fix State Management - Stale Map Reference
**File**: `src/dev-tools-agent/test-cases/TestResultContext.tsx` (MODIFY)

1. Update `TestResultContextValue` interface:
```typescript
interface TestResultContextValue {
  results: Map<string, TestResult>;
  resultsVersion: number; // ADD THIS
  // ... other fields
}
```

2. Expose `resultsVersion` in context value:
```typescript
const value: TestResultContextValue = {
  results,
  resultsVersion: resultsVersion, // ADD THIS
  // ... other fields
};
```

**Verification**: Context includes `resultsVersion`, components can access it.

---

### Step 0.5.2: Fix Selector Comparison Timing Issue
**File**: `src/dev-tools-agent/test-cases/TestRunner.ts` (MODIFY)

1. Update `compareResults` signature:
```typescript
function compareResults(
  testCase: TestCase,
  actual: ComponentContext,
  originalElement?: Element // ADD THIS
): { passed: boolean; errors: string[]; warnings: string[]; failureReason?: string }
```

2. Update selector comparison call:
```typescript
if (!areSelectorsEquivalent(testCase.expectedSelector, actual.selectorSummary, originalElement)) {
  // ... error handling
}
```

3. Update `runTest` to pass element:
```typescript
const comparison = compareResults(testCase, componentContext, element);
```

**Verification**: Selector comparison validates against original element.

---

### Step 0.5.3: Add Progress Updates in Batch Execution
**File**: `src/dev-tools-agent/test-cases/TestRunner.ts` (MODIFY)

1. Update `runTests` signature:
```typescript
export async function runTests(
  testCases: TestCase[],
  useAgentFallback: boolean = false,
  onTestComplete?: (result: TestResult) => void,
  onProgress?: (testCaseId: string, status: TestStatus) => void, // ADD THIS
  onCancel?: () => boolean
): Promise<TestResult[]>
```

2. Add progress call in loop:
```typescript
for (const testCase of testCases) {
  if (onCancel && onCancel()) break;
  onProgress?.(testCase.id, 'running'); // ADD THIS
  
  const result = await runTest(testCase, useAgentFallback, (status) => {
    onProgress?.(testCase.id, status); // ADD THIS
  }, onCancel);
  // ... rest
}
```

3. Update `runMultipleTests` in context:
```typescript
await runTests(
  testCases,
  useAgentFallback,
  (result) => updateResult(result),
  (testCaseId, status) => { // ADD THIS
    updateResult({ testCaseId, status, errors: [], warnings: [] });
  },
  () => cancelledRef.current
);
```

**Verification**: Progress updates appear in UI during batch execution.

---

### Step 0.5.4: Improve Error Handling in Batch Execution
**File**: `src/dev-tools-agent/test-cases/TestRunner.ts` (MODIFY)

Wrap test execution in try-catch:

```typescript
for (const testCase of testCases) {
  if (onCancel && onCancel()) break;
  onProgress?.(testCase.id, 'running');
  
  try { // ADD THIS
    const result = await runTest(testCase, useAgentFallback, (status) => {
      onProgress?.(testCase.id, status);
    }, onCancel);
    results.push(result);
    onTestComplete?.(result);
  } catch (error) { // ADD THIS
    const errorResult: TestResult = {
      testCaseId: testCase.id,
      status: 'failed',
      errors: [`Unexpected error: ${error instanceof Error ? error.message : String(error)}`],
      warnings: [],
      failureReason: 'Unexpected error in test execution',
      startedAt: Date.now(),
      completedAt: Date.now(),
      duration: 0,
    };
    results.push(errorResult);
    onTestComplete?.(errorResult);
    onProgress?.(testCase.id, 'failed');
  }
}
```

**Verification**: One test failure doesn't stop entire batch.

---

### Step 0.5.5: Fix Filter State Persistence Gap
**File**: `src/dev-tools-agent/test-cases/TestResultContext.tsx` (MODIFY)

1. Add constant:
```typescript
const FILTER_STORAGE_KEY = 'ui-agent-test-filters';
```

2. Update filter initialization:
```typescript
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
```

3. Update URL sync effect:
```typescript
useEffect(() => {
  // ... build params ...
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
```

**Verification**: Filter state persists even when URL sync skipped.

---

## Phase 1: Foundation - Types and Core Infrastructure

### Step 1.1: Create Type Definitions
**File**: `src/dev-tools-agent/test-cases/types.ts` (NEW)

```typescript
import type { ComponentContext } from '../types';

export type TestStatus = 'pending' | 'running' | 'passed' | 'failed';

export interface TestResult {
  testCaseId: string;
  status: TestStatus;
  duration?: number;
  actualSelector?: string;
  actualFile?: string | null;
  actualConfidence?: 'high' | 'medium' | 'low';
  actualSource?: 'heuristic' | 'agent';
  errors: string[];
  warnings: string[];
  failureReason?: string;
  startedAt?: number;
  completedAt?: number;
  componentContext?: ComponentContext;
}

export interface TestFilter {
  categories: string[];
  priorities: string[];
  tags: string[];
  statuses: TestStatus[];
  searchText: string;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  running: number;
  pending: number;
}
```

**Verification**: Types compile and can be imported.

---

### Step 1.2: Update TestCase Interface
**File**: `src/dev-tools-agent/test-cases/TestCaseRegistry.ts` (MODIFY)

Add to `TestCase` interface:
```typescript
export interface TestCase {
  // ... existing fields ...
  expectedSource?: 'heuristic' | 'agent';
  strictSourceCheck?: boolean;
}
```

**Verification**: All 55+ test cases still compile.

---

### Step 1.3: Create Test Runner - Core Functions
**File**: `src/dev-tools-agent/test-cases/TestRunner.ts` (NEW)

Add imports and helper functions:

```typescript
import type { TestCase } from './TestCaseRegistry';
import type { TestResult, TestStatus } from './types';
import type { SelectionPayload, ComponentContext, TestIdInfo } from '../types';
import { resolveSelection } from '../api';
import { buildSelector } from '../utils/buildSelector';

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

function buildSelectionPayload(element: Element): SelectionPayload {
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
}

export function findTestElement(testCaseId: string): Element | null {
  const element = document.querySelector(`[data-test-case-id="${testCaseId}"]`);
  if (element) return element;
  
  const testCaseViewer = document.querySelector(`[data-test-case-viewer-id="${testCaseId}"]`);
  if (testCaseViewer) {
    const target = testCaseViewer.querySelector(`[data-test-case-id="${testCaseId}"]`);
    if (target) return target as Element;
    console.warn(`Test case ${testCaseId}: data-test-case-id not found, using fallback`);
    const fallback = testCaseViewer.querySelector('[data-testid], button, a, input, [role="button"]');
    return fallback as Element | null;
  }
  return null;
}
```

**Verification**: Functions compile and can find elements.

---

### Step 1.4: Create Test Runner - Validation Functions
**File**: `src/dev-tools-agent/test-cases/TestRunner.ts` (MODIFY)

Add validation function:

```typescript
function validateSelectorDoesNotUseTestInfrastructure(
  selector: string,
  testCaseId: string
): { valid: boolean; error?: string } {
  if (selector.includes('[data-test-case-id')) {
    return {
      valid: false,
      error: `CRITICAL: Generated selector includes data-test-case-id attribute! Selector: ${selector}`,
    };
  }
  const regex = new RegExp(`\\[data-test-case-id=["']?${testCaseId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']?\\]`);
  if (regex.test(selector)) {
    return {
      valid: false,
      error: `CRITICAL: Generated selector includes test case ID! Selector: ${selector}`,
    };
  }
  return { valid: true };
}
```

**Verification**: Validation correctly identifies infrastructure leaks.

---

### Step 1.5: Create Test Runner - Comparison Logic
**File**: `src/dev-tools-agent/test-cases/TestRunner.ts` (MODIFY)

Add comparison function (use `areSelectorsEquivalent` and `normalizeFilePath` from Phase 0):

```typescript
function compareResults(
  testCase: TestCase,
  actual: ComponentContext,
  originalElement?: Element
): { passed: boolean; errors: string[]; warnings: string[]; failureReason?: string } {
  const errors: string[] = [];
  const warnings: string[] = [];
  let failureReason: string | undefined;

  // Compare selector
  if (testCase.expectedSelector !== null) {
    if (!areSelectorsEquivalent(testCase.expectedSelector, actual.selectorSummary, originalElement)) {
      errors.push(`Selector mismatch: expected "${testCase.expectedSelector}", got "${actual.selectorSummary}"`);
      if (!failureReason) failureReason = 'Selector mismatch';
    }
  } else {
    if (actual.selectorSummary && actual.selectorSummary !== 'null') {
      errors.push(`Expected null selector but got "${actual.selectorSummary}"`);
      if (!failureReason) failureReason = 'Unexpected selector generated';
    }
  }

  // Compare file path
  if (testCase.expectedFile !== null) {
    const normalizedExpected = normalizeFilePath(testCase.expectedFile);
    const normalizedActual = normalizeFilePath(actual.filePath);
    if (normalizedExpected !== normalizedActual) {
      errors.push(`File path mismatch: expected "${testCase.expectedFile}", got "${actual.filePath}"`);
      if (!failureReason) failureReason = 'File path mismatch';
    }
  } else {
    if (actual.filePath && actual.source === 'heuristic') {
      errors.push(`Expected no file resolution but got "${actual.filePath}"`);
      if (!failureReason) failureReason = 'Unexpected file resolution';
    }
  }

  // Compare confidence
  if (actual.confidence !== testCase.expectedConfidence) {
    errors.push(`Confidence mismatch: expected "${testCase.expectedConfidence}", got "${actual.confidence}"`);
    if (!failureReason) failureReason = 'Confidence level mismatch';
  }

  // Validate resolution mechanism
  if (testCase.expectedSource) {
    if (actual.source !== testCase.expectedSource) {
      const warning = `Resolution mechanism mismatch: expected ${testCase.expectedSource}, got ${actual.source}`;
      warnings.push(warning);
      if (testCase.strictSourceCheck) {
        errors.push(warning);
        if (!failureReason) failureReason = 'Resolution mechanism mismatch';
      }
    }
  }

  return { passed: errors.length === 0, errors, warnings, failureReason };
}
```

**Verification**: Comparison works correctly for all fields.

---

### Step 1.6: Create Test Runner - Single Test Execution
**File**: `src/dev-tools-agent/test-cases/TestRunner.ts` (MODIFY)

Add retry function and main test execution:

```typescript
export async function findTestElementWithRetry(
  testCaseId: string,
  maxRetries: number = 10,
  retryDelay: number = 100,
  maxTotalTime: number = 2000
): Promise<Element | null> {
  const startTime = Date.now();
  for (let i = 0; i < maxRetries; i++) {
    if (Date.now() - startTime > maxTotalTime) return null;
    const element = findTestElement(testCaseId);
    if (element) return element;
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  return null;
}

export async function runTest(
  testCase: TestCase,
  useAgentFallback: boolean = false,
  onProgress?: (status: TestStatus) => void,
  onCancel?: () => boolean
): Promise<TestResult> {
  const startTime = Date.now();
  const result: TestResult = {
    testCaseId: testCase.id,
    status: 'running',
    errors: [],
    warnings: [],
    startedAt: startTime,
  };

  try {
    onProgress?.('running');

    if (onCancel && onCancel()) {
      result.status = 'pending';
      result.errors.push('Test cancelled');
      result.completedAt = Date.now();
      result.duration = result.completedAt - startTime;
      return result;
    }

    const element = await findTestElementWithRetry(testCase.id);
    if (!element) {
      result.status = 'failed';
      result.errors.push(`Could not find target element for test case ${testCase.id} after retries`);
      result.failureReason = 'Element not found';
      result.completedAt = Date.now();
      result.duration = result.completedAt - startTime;
      return result;
    }

    const payload = buildSelectionPayload(element);
    const selectorValidation = validateSelectorDoesNotUseTestInfrastructure(payload.selector, testCase.id);
    if (!selectorValidation.valid) {
      result.status = 'failed';
      result.errors.push(selectorValidation.error!);
      result.failureReason = 'Test infrastructure leak detected';
      result.completedAt = Date.now();
      result.duration = result.completedAt - startTime;
      return result;
    }

    if (onCancel && onCancel()) {
      result.status = 'pending';
      result.errors.push('Test cancelled');
      result.completedAt = Date.now();
      result.duration = result.completedAt - startTime;
      return result;
    }

    let componentContext: ComponentContext;
    try {
      const timeoutMs = 30000;
      componentContext = await Promise.race([
        resolveSelection(payload, undefined, useAgentFallback),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('API call timeout')), timeoutMs)
        )
      ]);
    } catch (error) {
      result.status = 'failed';
      if (error instanceof Error && error.message === 'API call timeout') {
        result.errors.push(`API call timed out after 30s`);
        result.failureReason = 'API timeout';
      } else {
        result.errors.push(`API call failed: ${error instanceof Error ? error.message : String(error)}`);
        result.failureReason = 'API error';
      }
      result.completedAt = Date.now();
      result.duration = result.completedAt - startTime;
      return result;
    }

    if (onCancel && onCancel()) {
      result.status = 'pending';
      result.errors.push('Test cancelled');
      result.completedAt = Date.now();
      result.duration = result.completedAt - startTime;
      return result;
    }

    result.actualSelector = componentContext.selectorSummary;
    result.actualFile = componentContext.filePath || null;
    result.actualConfidence = componentContext.confidence;
    result.actualSource = componentContext.source;
    result.componentContext = componentContext;

    const comparison = compareResults(testCase, componentContext, element);
    result.errors = comparison.errors;
    result.warnings = comparison.warnings;
    result.failureReason = comparison.failureReason;
    result.status = comparison.passed ? 'passed' : 'failed';
  } catch (error) {
    result.status = 'failed';
    result.errors.push(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    result.failureReason = 'Unexpected error';
  } finally {
    result.completedAt = Date.now();
    result.duration = result.completedAt - result.startedAt!;
    onProgress?.(result.status);
  }

  return result;
}
```

**Verification**: Can run a single test and get proper result.

---

### Step 1.7: Create Test Runner - Batch Execution
**File**: `src/dev-tools-agent/test-cases/TestRunner.ts` (MODIFY)

Add batch execution function (already updated in Phase 0.5.3 and 0.5.4):

```typescript
export async function runTests(
  testCases: TestCase[],
  useAgentFallback: boolean = false,
  onTestComplete?: (result: TestResult) => void,
  onProgress?: (testCaseId: string, status: TestStatus) => void,
  onCancel?: () => boolean
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  for (const testCase of testCases) {
    if (onCancel && onCancel()) break;
    onProgress?.(testCase.id, 'running');

    try {
      const result = await runTest(
        testCase,
        useAgentFallback,
        (status) => onProgress?.(testCase.id, status),
        onCancel
      );
      results.push(result);
      onTestComplete?.(result);
    } catch (error) {
      const errorResult: TestResult = {
        testCaseId: testCase.id,
        status: 'failed',
        errors: [`Unexpected error: ${error instanceof Error ? error.message : String(error)}`],
        warnings: [],
        failureReason: 'Unexpected error in test execution',
        startedAt: Date.now(),
        completedAt: Date.now(),
        duration: 0,
      };
      results.push(errorResult);
      onTestComplete?.(errorResult);
      onProgress?.(testCase.id, 'failed');
    }
  }

  return results;
}
```

**Verification**: Can run multiple tests sequentially with progress updates.

---

### Step 1.8: Improve Element Finding with Fallback
**File**: `src/dev-tools-agent/test-cases/TestRunner.ts` (MODIFY)

Already implemented in Step 1.3. Verify fallback logic works correctly.

**Verification**: Finds elements with direct attribute, falls back when needed.

---

## Phase 2: State Management

### Step 2.1: Create Test Result Context - Basic Structure
**File**: `src/dev-tools-agent/test-cases/TestResultContext.tsx` (NEW)

Create basic structure:

```typescript
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { TestCase } from './TestCaseRegistry';
import type { TestResult, TestFilter, TestSummary, TestStatus } from './types';
import { runTest, runTests } from './TestRunner';
import { useAgentFallbackFromStorage } from './AgentFallbackContext';

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
  // Implementation in next steps
  return (
    <TestResultContext.Provider value={/* ... */}>
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
```

**Verification**: File compiles, provider can wrap components.

---

### Step 2.2: Add State Management - Results Map
**File**: `src/dev-tools-agent/test-cases/TestResultContext.tsx` (MODIFY)

Add state management (from Phase 0.3 and 0.5.1):

```typescript
const STORAGE_KEY = 'ui-agent-test-results';
const FILTER_STORAGE_KEY = 'ui-agent-test-filters';

export function TestResultProvider({ children }: { children: React.ReactNode }) {
  const resultsRef = useRef<Map<string, TestResult>>(new Map());
  const [resultsVersion, setResultsVersion] = useState(0);
  
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

  // ... rest of implementation
}
```

**Verification**: Results load from localStorage, state updates work.

---

### Step 2.3: Add Filter State with URL Persistence
**File**: `src/dev-tools-agent/test-cases/TestResultContext.tsx` (MODIFY)

Add filter state (from Phase 0.5.5):

```typescript
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
```

**Verification**: Filter loads from URL/localStorage, updates URL when changed.

---

### Step 2.4: Add localStorage Persistence - Save with Debouncing
**File**: `src/dev-tools-agent/test-cases/TestResultContext.tsx` (MODIFY)

Add debounced save:

```typescript
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
```

**Verification**: Results save after 1 second, beforeunload saves immediately.

---

### Step 2.5: Add Test Execution Functions
**File**: `src/dev-tools-agent/test-cases/TestResultContext.tsx` (MODIFY)

Add execution functions:

```typescript
const updateResult = useCallback((result: TestResult) => {
  resultsRef.current.set(result.testCaseId, result);
  setResultsVersion(v => v + 1);
}, []);

const useAgentFallback = useAgentFallbackFromStorage();
const cancelledRef = useRef(false);

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
```

**Verification**: Can run single and multiple tests, results update in real-time.

---

### Step 2.6: Add Helper Functions and Summary
**File**: `src/dev-tools-agent/test-cases/TestResultContext.tsx` (MODIFY)

Add helper functions:

```typescript
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
```

**Verification**: All helper functions work, summary calculates correctly.

---

## Phase 3: UI Components

### Step 3.1: Create Test Controls - Basic Structure
**File**: `src/dev-tools-agent/test-cases/components/TestControls.tsx` (NEW)

```typescript
import { useMemo } from 'react';
import { useTestResults } from '../TestResultContext';
import { TEST_CASES } from '../TestCaseRegistry';

export function TestControls() {
  const { filter, setFilter, summary, runMultipleTests, clearResults, isAnyRunning, cancel } = useTestResults();

  const categories = useMemo(() => Array.from(new Set(TEST_CASES.map(tc => tc.category))), []);
  const priorities = useMemo(() => Array.from(new Set(TEST_CASES.map(tc => tc.priority))), []);
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    TEST_CASES.forEach(tc => tc.tags.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, []);

  const filteredTestCases = useMemo(() => {
    return TEST_CASES.filter(tc => {
      if (filter.categories.length > 0 && !filter.categories.includes(tc.category)) return false;
      if (filter.priorities.length > 0 && !filter.priorities.includes(tc.priority)) return false;
      if (filter.tags.length > 0 && !filter.tags.some(tag => tc.tags.includes(tag))) return false;
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        if (!tc.name.toLowerCase().includes(searchLower) && !tc.description.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      return true;
    });
  }, [filter]);

  return (
    <div className="bg-surface border border-default rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary">Test Controls</h2>
        <div className="text-sm text-muted">
          <span className="font-semibold">Total:</span> {summary.total} |{' '}
          <span className="text-green-600 font-semibold">Passed:</span> {summary.passed} |{' '}
          <span className="text-red-600 font-semibold">Failed:</span> {summary.failed} |{' '}
          <span className="text-yellow-600 font-semibold">Running:</span> {summary.running} |{' '}
          <span className="text-gray-600 font-semibold">Pending:</span> {summary.pending}
        </div>
      </div>
      {/* Filters and buttons - see full implementation in design doc */}
    </div>
  );
}
```

**Verification**: Component renders, shows summary statistics.

---

### Step 3.2-3.5: Add Filter UI and Action Buttons
**File**: `src/dev-tools-agent/test-cases/components/TestControls.tsx` (MODIFY)

Add filter checkboxes and action buttons. See full implementation in design document for complete code.

**Key elements**:
- Category filter checkboxes
- Priority filter checkboxes
- Tag filter checkboxes (show first 10)
- Search input
- "Run All" button
- "Run Filtered" button
- "Clear Results" button
- "Cancel" button (conditional)

**Verification**: All filters work, buttons trigger correct actions.

---

### Step 3.6: Enhance TestCaseViewer - Basic Result Display
**File**: `src/dev-tools-agent/test-cases/components/TestCaseViewer.tsx` (MODIFY)

Add result display:

```typescript
import { useMemo } from 'react';
import { useTestResults } from '../TestResultContext';
import type { TestStatus } from '../types';

function getStatusBadgeColor(status: TestStatus): string {
  switch (status) {
    case 'passed': return 'bg-green-600 text-white';
    case 'failed': return 'bg-red-600 text-white';
    case 'running': return 'bg-blue-600 text-white animate-pulse';
    case 'pending': return 'bg-gray-400 text-white';
  }
}

function formatDuration(ms?: number): string {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function TestCaseViewer({ testCase, children }: TestCaseViewerProps) {
  const { results, resultsVersion, runSingleTest, isRunning } = useTestResults();
  const result = useMemo(() => results.get(testCase.id), [results, resultsVersion, testCase.id]);
  
  return (
    <div className={`relative border-2 rounded-lg p-4 m-4`} data-test-case-viewer-id={testCase.id}>
      <div className="absolute top-2 right-2 flex items-center gap-2">
        {result && (
          <div className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(result.status)}`}>
            {result.status.toUpperCase()}
            {result.duration && ` (${formatDuration(result.duration)})`}
          </div>
        )}
        <div className="bg-gray-800 text-white px-2 py-1 rounded text-xs font-mono">
          {testCase.id}
        </div>
      </div>
      {/* ... existing content ... */}
      {/* Test results section - see design doc for full implementation */}
      <div data-test-case-id={testCase.id}>
        {children}
      </div>
    </div>
  );
}
```

**Verification**: Status badge appears, shows correct status and duration.

---

### Step 3.7-3.8: Enhance TestCaseViewer - Result Details
**File**: `src/dev-tools-agent/test-cases/components/TestCaseViewer.tsx` (MODIFY)

Add result details section with:
- Expected vs Actual comparison
- Error details (collapsible)
- Warnings section
- Resolution mechanism info
- Infrastructure leak warning

See design document for complete implementation.

**Verification**: All result details display correctly.

---

### Step 3.9: Create Error Boundary Component
**File**: `src/dev-tools-agent/test-cases/components/TestErrorBoundary.tsx` (NEW)

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class TestErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Test runner error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Test Runner Error</h3>
          <p className="text-sm text-red-700 mb-4">
            {this.state.error?.message || 'An unexpected error occurred in the test runner.'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reset Test Runner
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Verification**: Error boundary catches errors and displays message.

---

### Step 3.10: Integrate TestControls into TestCasesPage
**File**: `src/dev-tools-agent/test-cases/TestCasesPage.tsx` (MODIFY)

```typescript
import { AgentFallbackProvider } from './AgentFallbackContext';
import { TestResultProvider } from './TestResultContext';
import { TestErrorBoundary } from './components/TestErrorBoundary';
import { TestControls } from './components/TestControls';
// ... other imports

export function TestCasesPage() {
  return (
    <AgentFallbackProvider>
      <TestResultProvider>
        <TestErrorBoundary>
          <TestCasesPageContent />
        </TestErrorBoundary>
      </TestResultProvider>
    </AgentFallbackProvider>
  );
}

function TestCasesPageContent() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* ... existing header ... */}
      <TestControls />
      {/* ... existing content ... */}
    </div>
  );
}
```

**Verification**: Page loads, TestControls appears, no errors.

---

## Phase 4: Test Case Updates

### Step 4.1-4.5: Update Test Case Components
**Files**: 
- `src/dev-tools-agent/test-cases/components/TestIdVariations.tsx`
- `src/dev-tools-agent/test-cases/components/CssSelectorScenarios.tsx`
- `src/dev-tools-agent/test-cases/components/DynamicContent.tsx`
- `src/dev-tools-agent/test-cases/components/EdgeCases.tsx`
- `src/dev-tools-agent/test-cases/components/ComponentPatterns.tsx`

**Task**: Add `data-test-case-id={testCase.id}` to each target element.

**Example**:
```typescript
<button 
  data-testid="user-button"
  data-test-case-id={testCases[0].id}
>
  User Button
</button>
```

**Verification**: All elements have `data-test-case-id` attribute, can be found by test runner.

---

### Step 4.6: Add Infrastructure Validation Test Case
**File**: `src/dev-tools-agent/test-cases/TestCaseRegistry.ts` (MODIFY)

Add to `TEST_CASES` array:
```typescript
{
  id: 'infrastructure-01',
  category: 'edge',
  name: 'Test infrastructure exclusion',
  description: 'Element with both data-testid and data-test-case-id - selector must only use data-testid',
  expectedSelector: '[data-testid="test-button"]',
  expectedFile: null,
  expectedConfidence: 'high',
  expectedSource: 'heuristic',
  strictSourceCheck: true,
  tags: ['infrastructure', 'validation', 'critical'],
  priority: 'p0'
}
```

**Verification**: Test case appears in registry.

---

### Step 4.7: Create Infrastructure Test Case Component
**File**: `src/dev-tools-agent/test-cases/components/EdgeCases.tsx` (MODIFY)

Add component:
```typescript
<TestCaseViewer testCase={infrastructureTestCase}>
  <button 
    data-testid="test-button"
    data-test-case-id="infrastructure-01"
  >
    Test Button
  </button>
</TestCaseViewer>
```

**Verification**: Component renders, element has both attributes.

---

## Phase 5: Testing and Validation

### Steps 5.1-5.7: Manual Testing

Test the following:
1. Single test execution
2. Batch execution
3. Filtering (all types)
4. Infrastructure validation
5. Resolution mechanism validation
6. Edge cases (missing element, API timeout, etc.)
7. Performance (run all 55+ tests)

**Verification**: All functionality works as expected.

---

## Phase 6: Polish and Documentation

### Steps 6.1-6.4: Final Improvements

1. Add loading states and animations
2. Improve error messages
3. Add tooltips and help text
4. Code review and refactoring

**Verification**: Code is clean, user experience is polished.

---

## Critical Implementation Notes

1. **Always use `resultsVersion` dependency** in components that read results
2. **Never use `data-test-case-id` in selector generation** - only for element location
3. **Validate selectors don't include test infrastructure** before running tests
4. **Handle all error cases gracefully** - don't let one failure stop entire batch
5. **Save results to localStorage** with debouncing and size management
6. **Check cancellation** at key points in test execution
7. **Use semantic selector comparison** - not exact string matching
8. **Normalize file paths** before comparison

---

## Verification Checklist

After implementation, verify:
- [ ] All 55+ test cases can be run
- [ ] Results display correctly
- [ ] Filtering works for all types
- [ ] URL state persistence works
- [ ] localStorage persistence works
- [ ] Cancellation works correctly
- [ ] Infrastructure validation works
- [ ] Resolution mechanism validation works
- [ ] Error handling is comprehensive
- [ ] Performance is acceptable
- [ ] No console errors
- [ ] No TypeScript errors

---

## File Structure

```
src/dev-tools-agent/test-cases/
├── types.ts (NEW)
├── TestRunner.ts (NEW)
├── TestResultContext.tsx (NEW)
├── TestCaseRegistry.ts (MODIFY)
├── TestCasesPage.tsx (MODIFY)
├── components/
│   ├── TestControls.tsx (NEW)
│   ├── TestErrorBoundary.tsx (NEW)
│   ├── TestCaseViewer.tsx (MODIFY)
│   ├── TestIdVariations.tsx (MODIFY)
│   ├── CssSelectorScenarios.tsx (MODIFY)
│   ├── DynamicContent.tsx (MODIFY)
│   ├── EdgeCases.tsx (MODIFY)
│   └── ComponentPatterns.tsx (MODIFY)
```

---

**End of Implementation Guide**

