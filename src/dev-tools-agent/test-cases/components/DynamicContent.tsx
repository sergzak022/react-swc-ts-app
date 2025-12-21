import { useState } from 'react';
import { TestCaseViewer } from './TestCaseViewer';
import { getTestCasesByCategory } from '../TestCaseRegistry';

export function DynamicContent() {
  const testCases = getTestCasesByCategory('dynamic');
  // Use separate state for each conditional test case
  const [condition1, setCondition1] = useState(true); // For dynamic-03
  const [condition2, setCondition2] = useState(true); // For dynamic-04
  const items = Array.from({ length: 10 }, (_, i) => i);
  
  return (
    <div className="test-category">
      <h2 className="text-2xl font-bold mb-4">Dynamic Content (8 cases)</h2>
      <div className="space-y-4">
        {/* dynamic-01: List item without testid */}
        <TestCaseViewer testCase={testCases[0]}>
          <ul>
            <li>Item 1</li>
            <li>Item 2 (target)</li>
            <li>Item 3</li>
          </ul>
        </TestCaseViewer>
        
        {/* dynamic-02: Map-rendered items with index */}
        <TestCaseViewer testCase={testCases[1]}>
          <ul>
            {items.map((_item, index) => (
              <li key={index} data-testid={`item-${index}`}>
                Item {index}
              </li>
            ))}
          </ul>
        </TestCaseViewer>
        
        {/* dynamic-03: Conditionally rendered element */}
        <TestCaseViewer testCase={testCases[2]}>
          <div>
            {condition1 && <div className="conditional">Conditional Content</div>}
            <button onClick={() => setCondition1(!condition1)}>Toggle</button>
          </div>
        </TestCaseViewer>
        
        {/* dynamic-04: Ternary rendered element */}
        <TestCaseViewer testCase={testCases[3]}>
          <div>
            {condition2 ? (
              <div className="variant-a">Variant A</div>
            ) : (
              <div className="variant-b">Variant B</div>
            )}
            <button onClick={() => setCondition2(!condition2)}>Toggle</button>
          </div>
        </TestCaseViewer>
        
        {/* dynamic-05: Virtualized list item */}
        <TestCaseViewer testCase={testCases[4]}>
          <div role="list">
            <div role="listitem">Virtualized Item</div>
          </div>
        </TestCaseViewer>
        
        {/* dynamic-06: Sortable list item */}
        <TestCaseViewer testCase={testCases[5]}>
          <div className="sortable-item">Sortable Item</div>
        </TestCaseViewer>
        
        {/* dynamic-07: Filtered list item */}
        <TestCaseViewer testCase={testCases[6]}>
          <div className="filtered-item">Filtered Item</div>
        </TestCaseViewer>
        
        {/* dynamic-08: Paginated content */}
        <TestCaseViewer testCase={testCases[7]}>
          <div className="paginated-item">Paginated Item</div>
        </TestCaseViewer>
      </div>
    </div>
  );
}

