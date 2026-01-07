import type { TestCase } from './TestCaseRegistry';
import type { TestResult, TestStatus } from './types';
import type { SelectionPayload, ComponentContext, TestIdInfo } from '../types';
import { resolveSelection } from '../api';
import { buildSelector } from '../utils/buildSelector';

/**
 * Semantic selector comparison - checks if two selectors target the same elements
 */
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
    for (const el of Array.from(set1)) {
      if (!set2.has(el)) return false;
    }
    return true;
  } catch {
    return selector1.trim() === selector2.trim();
  }
}

/**
 * Normalizes file paths for comparison
 */
function normalizeFilePath(filePath: string | null | undefined): string | null {
  if (!filePath) return null;
  let normalized = filePath.replace(/^\.\//, '');
  normalized = normalized.replace(/\\/g, '/');
  normalized = normalized.replace(/\/$/, '');
  return normalized;
}

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
  // First, try to find all elements with data-test-case-id
  const allMatches = document.querySelectorAll(`[data-test-case-id="${testCaseId}"]`);
  
  // Prioritize elements that are actual targets (have data-testid, id, or are interactive elements)
  // Skip wrapper divs that only exist to wrap children
  for (const element of Array.from(allMatches)) {
    // If it has data-testid or id, it's definitely a target
    if (element.hasAttribute('data-testid') || element.hasAttribute('id')) {
      return element;
    }
    // If it's an interactive element (button, input, etc.), it's a target
    if (['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A'].includes(element.tagName)) {
      return element;
    }
    // If it has role="button" or similar, it's a target
    if (element.hasAttribute('role')) {
      return element;
    }
    // Skip if it's just a wrapper div with no identifying attributes and has children with data-test-case-id
    if (element.tagName === 'DIV' && 
        !element.hasAttribute('data-testid') && 
        !element.hasAttribute('id') &&
        element.children.length > 0) {
      const hasChildWithTestId = Array.from(element.children).some(
        child => child.hasAttribute('data-test-case-id')
      );
      if (hasChildWithTestId) {
        continue; // This is likely a wrapper, skip it
      }
    }
    // Otherwise, assume it's a target element
    return element;
  }
  
  // Fallback: try within viewer
  const testCaseViewer = document.querySelector(`[data-test-case-viewer-id="${testCaseId}"]`);
  if (testCaseViewer) {
    // Look for elements with data-test-case-id that are actual targets
    const allInViewer = testCaseViewer.querySelectorAll(`[data-test-case-id="${testCaseId}"]`);
    for (const element of Array.from(allInViewer)) {
      // Prioritize elements with data-testid or interactive elements
      if (element.hasAttribute('data-testid') || 
          ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A'].includes(element.tagName) ||
          element.hasAttribute('role')) {
        return element;
      }
    }
    // If we found any element with data-test-case-id, return the first one
    if (allInViewer.length > 0) {
      return allInViewer[0];
    }
    console.warn(`Test case ${testCaseId}: data-test-case-id not found, using fallback`);
    const fallback = testCaseViewer.querySelector('[data-testid], button, a, input, [role="button"]');
    return fallback as Element | null;
  }
  return null;
}

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

