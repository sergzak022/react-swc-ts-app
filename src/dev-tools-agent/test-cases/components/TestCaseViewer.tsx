import { useMemo, useState } from 'react';
import type { TestCase } from '../TestCaseRegistry';
import { useTestResults } from '../TestResultContext';
import type { TestStatus } from '../types';

interface TestCaseViewerProps {
  testCase: TestCase;
  children: React.ReactNode;
}

function getBorderColor(confidence: 'high' | 'medium' | 'low'): string {
  switch (confidence) {
    case 'high':
      return 'border-green-500 bg-green-50';
    case 'medium':
      return 'border-yellow-500 bg-yellow-50';
    case 'low':
      return 'border-red-500 bg-red-50';
  }
}

function getConfidenceBadgeColor(confidence: 'high' | 'medium' | 'low'): string {
  switch (confidence) {
    case 'high':
      return 'bg-green-600 text-white';
    case 'medium':
      return 'bg-yellow-600 text-white';
    case 'low':
      return 'bg-red-600 text-white';
  }
}

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
  const [showDetails, setShowDetails] = useState(false);
  
  const borderColor = getBorderColor(testCase.expectedConfidence);
  const badgeColor = getConfidenceBadgeColor(testCase.expectedConfidence);
  
  return (
    <div className={`relative border-2 rounded-lg p-4 m-4 ${borderColor}`} data-test-case-viewer-id={testCase.id}>
      {/* Test Case ID Badge and Status Badge */}
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
      
      {/* Category Label */}
      <div className="text-xs text-gray-600 mb-2 uppercase tracking-wide">
        {testCase.category}
      </div>
      
      {/* Test Case Name */}
      <h3 className="font-semibold text-lg mb-1">{testCase.name}</h3>
      
      {/* Description */}
      <p className="text-sm text-gray-700 mb-3">{testCase.description}</p>
      
      {/* Metadata */}
      <div className="text-xs space-y-1 mb-3 bg-white p-2 rounded border">
        <div>
          <span className="font-semibold">Expected Selector:</span>{' '}
          {testCase.expectedSelector === null ? (
            <span className="text-red-600 italic">null (cannot generate)</span>
          ) : (
            <code className="bg-gray-100 px-1 rounded">{testCase.expectedSelector}</code>
          )}
        </div>
        <div>
          <span className="font-semibold">Expected File:</span>{' '}
          {testCase.expectedFile === null ? (
            <span className="text-orange-600 italic">null (heuristics cannot resolve)</span>
          ) : (
            <code className="bg-gray-100 px-1 rounded">{testCase.expectedFile}</code>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold">Expected Confidence:</span>
          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${badgeColor}`}>
            {testCase.expectedConfidence}
          </span>
        </div>
        <div>
          <span className="font-semibold">Priority:</span>{' '}
          <span className="text-gray-600">{testCase.priority}</span>
        </div>
      </div>
      
      {/* Test Results Section */}
      {result && (
        <div className="mb-3 mt-3 border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </button>
            {!isRunning(testCase.id) && (
              <button
                onClick={() => runSingleTest(testCase)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Run Test
              </button>
            )}
          </div>
          
          {showDetails && (
            <div className="bg-white p-3 rounded border space-y-2 text-sm">
              {/* Expected vs Actual Comparison */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="font-semibold text-xs text-gray-600 mb-1">Expected Selector</div>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                    {testCase.expectedSelector ?? 'null'}
                  </code>
                </div>
                <div>
                  <div className="font-semibold text-xs text-gray-600 mb-1">Actual Selector</div>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                    {result.actualSelector ?? 'null'}
                  </code>
                </div>
                <div>
                  <div className="font-semibold text-xs text-gray-600 mb-1">Expected File</div>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                    {testCase.expectedFile ?? 'null'}
                  </code>
                </div>
                <div>
                  <div className="font-semibold text-xs text-gray-600 mb-1">Actual File</div>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                    {result.actualFile ?? 'null'}
                  </code>
                </div>
                <div>
                  <div className="font-semibold text-xs text-gray-600 mb-1">Expected Confidence</div>
                  <span className={`text-xs px-2 py-1 rounded inline-block ${badgeColor}`}>
                    {testCase.expectedConfidence}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-xs text-gray-600 mb-1">Actual Confidence</div>
                  <span className={`text-xs px-2 py-1 rounded inline-block ${getConfidenceBadgeColor(result.actualConfidence || 'low')}`}>
                    {result.actualConfidence ?? 'N/A'}
                  </span>
                </div>
              </div>

              {/* Resolution Mechanism */}
              {result.actualSource && (
                <div>
                  <div className="font-semibold text-xs text-gray-600 mb-1">Resolution Mechanism</div>
                  <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                    {result.actualSource}
                  </span>
                </div>
              )}

              {/* Errors */}
              {result.errors.length > 0 && (
                <div>
                  <div className="font-semibold text-xs text-red-600 mb-1">Errors</div>
                  <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
                    {result.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div>
                  <div className="font-semibold text-xs text-yellow-600 mb-1">Warnings</div>
                  <ul className="list-disc list-inside text-xs text-yellow-700 space-y-1">
                    {result.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Failure Reason */}
              {result.failureReason && (
                <div>
                  <div className="font-semibold text-xs text-red-600 mb-1">Failure Reason</div>
                  <div className="text-xs text-red-700">{result.failureReason}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Test Element */}
      <div 
        className={`
          test-element mt-4 p-4 bg-white rounded border border-dashed border-gray-300
          [&_button:not([class*='bg-'])]:bg-blue-500 
          [&_button:not([class*='bg-'])]:text-white 
          [&_button:not([class*='bg-'])]:px-6 
          [&_button:not([class*='bg-'])]:py-3 
          [&_button:not([class*='bg-'])]:mx-2 
          [&_button:not([class*='bg-'])]:my-2 
          [&_button:not([class*='bg-'])]:rounded 
          [&_button:not([class*='bg-'])]:font-medium 
          [&_button:not([class*='bg-'])]:cursor-pointer 
          [&_button:not([class*='bg-'])]:shadow-sm 
          [&_button:not([class*='bg-'])]:transition-all 
          [&_button:not([class*='bg-'])]:hover:bg-blue-600 
          [&_button:not([class*='bg-'])]:hover:shadow-md 
          [&_button:not([class*='bg-'])]:hover:-translate-y-px
          [&_a:not([class*='text-'])]:text-blue-600 
          [&_a:not([class*='text-'])]:underline 
          [&_a:not([class*='text-'])]:font-medium 
          [&_a:not([class*='text-'])]:hover:text-blue-700
          [&_input:not([class*='border-'])]:border-2 
          [&_input:not([class*='border-'])]:border-blue-500 
          [&_input:not([class*='border-'])]:px-2 
          [&_input:not([class*='border-'])]:py-1 
          [&_input:not([class*='border-'])]:rounded 
          [&_input:not([class*='border-'])]:outline-none
          [&_input:not([class*='border-'])]:focus:border-blue-600 
          [&_input:not([class*='border-'])]:focus:ring-2 
          [&_input:not([class*='border-'])]:focus:ring-blue-200
          [&_[role='button']:not([class*='bg-'])]:bg-blue-500 
          [&_[role='button']:not([class*='bg-'])]:text-white 
          [&_[role='button']:not([class*='bg-'])]:px-6 
          [&_[role='button']:not([class*='bg-'])]:py-3 
          [&_[role='button']:not([class*='bg-'])]:mx-2 
          [&_[role='button']:not([class*='bg-'])]:my-2 
          [&_[role='button']:not([class*='bg-'])]:rounded 
          [&_[role='button']:not([class*='bg-'])]:cursor-pointer 
          [&_[role='button']:not([class*='bg-'])]:inline-block
        `}
      >
        {children}
      </div>
    </div>
  );
}

