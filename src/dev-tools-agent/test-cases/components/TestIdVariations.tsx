import { TestCaseViewer } from './TestCaseViewer';
import { getTestCasesByCategory } from '../TestCaseRegistry';

// Constants that resolvers will search for
const BUTTON_ID = "action-btn";

const TestIds = {
  SUBMIT: "submit-button",
  item: (name: string) => `item-${name}`
};

// Component for testid-09 (prop-passed testid)
function ComponentWithTestId({ testId }: { testId: string }) {
  return <div data-testid={testId}>Prop-passed testid component</div>;
}

// Component for testid-10 (spread props)
interface TestIdProps {
  'data-testid': string;
}
function ComponentWithSpreadTestId(props: TestIdProps) {
  return <div {...props}>Spread props component</div>;
}

export function TestIdVariations() {
  const testCases = getTestCasesByCategory('data-testid');
  
  // Verify test cases match expected IDs (safety check)
  if (testCases.length !== 10 || testCases[0]?.id !== 'testid-01') {
    console.warn('[TestIdVariations] Test case order mismatch!');
  }
  
  return (
    <div className="test-category">
      <h2 className="text-2xl font-bold mb-4">data-testid Variations (10 cases)</h2>
      <div className="space-y-4">
        {/* testid-01: Literal data-testid */}
        <TestCaseViewer testCase={testCases[0]}>
          <button data-testid="user-button" data-test-case-id={testCases[0].id}>User Button</button>
        </TestCaseViewer>
        
        {/* testid-02: Constant data-testid */}
        <TestCaseViewer testCase={testCases[1]}>
          <button data-testid={BUTTON_ID} data-test-case-id={testCases[1].id}>Action Button</button>
        </TestCaseViewer>
        
        {/* testid-03: Namespaced data-testid */}
        <TestCaseViewer testCase={testCases[2]}>
          <button data-testid={TestIds.SUBMIT} data-test-case-id={testCases[2].id}>Submit</button>
        </TestCaseViewer>
        
        {/* testid-04: Function-generated testid */}
        <TestCaseViewer testCase={testCases[3]}>
          <div data-testid={TestIds.item("user")} data-test-case-id={testCases[3].id}>User Item</div>
        </TestCaseViewer>
        
        {/* testid-05: Nested element with parent testid */}
        <TestCaseViewer testCase={testCases[4]}>
          <div data-testid="card">
            <span data-test-case-id={testCases[4].id}>Nested span text</span>
          </div>
        </TestCaseViewer>
        
        {/* testid-06: Distant ancestor testid */}
        <TestCaseViewer testCase={testCases[5]}>
          <div data-testid="container">
            <div>
              <div>
                <div>
                  <div>
                    <span data-test-case-id={testCases[5].id}>Deeply nested span</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TestCaseViewer>
        
        {/* testid-07: Duplicate testid values */}
        <TestCaseViewer testCase={testCases[6]}>
          <div>
            <button data-testid="duplicate" data-test-case-id={testCases[6].id}>First duplicate</button>
            <button data-testid="duplicate">Second duplicate</button>
          </div>
        </TestCaseViewer>
        
        {/* testid-08: Template literal testid */}
        <TestCaseViewer testCase={testCases[7]}>
          <div data-testid={`card-${123}`} data-test-case-id={testCases[7].id}>Card with ID 123</div>
        </TestCaseViewer>
        
        {/* testid-09: Prop-passed testid */}
        <TestCaseViewer testCase={testCases[8]}>
          <div data-test-case-id={testCases[8].id}>
            <ComponentWithTestId testId="prop-passed" />
          </div>
        </TestCaseViewer>
        
        {/* testid-10: Spread testid */}
        <TestCaseViewer testCase={testCases[9]}>
          <div data-test-case-id={testCases[9].id}>
            <ComponentWithSpreadTestId data-testid="spread-props" />
          </div>
        </TestCaseViewer>
      </div>
    </div>
  );
}

