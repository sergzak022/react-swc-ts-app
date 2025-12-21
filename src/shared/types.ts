/**
 * Shared type definitions for UI-Agent.
 * Used by both frontend overlay and backend server.
 */

/**
 * A line in the code snippet.
 */
export interface CodeLine {
  lineNumber: number;
  content: string;
  isMatch: boolean;
}

/**
 * Code snippet around the matched line.
 */
export interface CodeSnippet {
  lines: CodeLine[];
  startLine: number;
  endLine: number;
  matchLine: number;
}

/**
 * Information about the data-testid and its relationship to the clicked element.
 */
export interface TestIdInfo {
  /** The data-testid value */
  value: string;

  /** True if testId is directly on the clicked element */
  onSelf: boolean;

  /** Number of parent levels traversed (0 = self, 1 = parent, 2 = grandparent, etc.) */
  depth: number;

  /** Tag name of the element that has the testId */
  ancestorTagName: string;
}

export interface SelectionPayload {
  pageUrl: string;

  /** CSS selector targeting the exact clicked element */
  selector: string;

  /** TestId info, or null if no data-testid found on element or ancestors */
  testId: TestIdInfo | null;

  domOuterHtml: string;
  textSnippet: string;
  classes: string[];
}

export interface ComponentContext {
  id: string;
  source: 'heuristic' | 'agent';
  confidence: 'high' | 'medium' | 'low';
  filePath: string;
  componentName?: string;
  lineNumber?: number;
  selectorSummary: string;
  domSummary: string;
  needsVerification: boolean;
  probeId?: string;
  verified: boolean;
  /** Code snippet around the matched line (10 lines above/below) */
  codeSnippet?: CodeSnippet;
}

