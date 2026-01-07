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

