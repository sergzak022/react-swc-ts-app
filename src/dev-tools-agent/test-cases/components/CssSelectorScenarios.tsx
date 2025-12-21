import { useState } from 'react';
import { TestCaseViewer } from './TestCaseViewer';
import { getTestCasesByCategory } from '../TestCaseRegistry';
import styles from './CssSelectorScenarios.module.css';

export function CssSelectorScenarios() {
  const testCases = getTestCasesByCategory('css');
  const [isActive, setIsActive] = useState(false);
  
  return (
    <div className="test-category">
      <h2 className="text-2xl font-bold mb-4">CSS Selector Scenarios (15 cases)</h2>
      <div className="space-y-4">
        {/* css-01: Unique ID selector */}
        <TestCaseViewer testCase={testCases[0]}>
          <h1 id="main-header">Main Header</h1>
        </TestCaseViewer>
        
        {/* css-02: Class-based selector */}
        <TestCaseViewer testCase={testCases[1]}>
          <button className="btn-primary large">Button</button>
        </TestCaseViewer>
        
        {/* css-03: CSS Module classes */}
        <TestCaseViewer testCase={testCases[2]}>
          <div className={styles.card}>CSS Module Card</div>
        </TestCaseViewer>
        
        {/* css-04: Tailwind utility classes */}
        <TestCaseViewer testCase={testCases[3]}>
          <div className="flex items-center justify-between">Tailwind Container</div>
        </TestCaseViewer>
        
        {/* css-05: nth-of-type selector */}
        <TestCaseViewer testCase={testCases[4]}>
          <div>
            <button>First</button>
            <button>Second</button>
            <button>Third</button>
          </div>
        </TestCaseViewer>
        
        {/* css-06: nth-child selector */}
        <TestCaseViewer testCase={testCases[5]}>
          <div>
            <span>First</span>
            <button>Second (target)</button>
          </div>
        </TestCaseViewer>
        
        {/* css-07: Compound selector */}
        <TestCaseViewer testCase={testCases[6]}>
          <div className="container">
            <button className="submit">Submit</button>
          </div>
        </TestCaseViewer>
        
        {/* css-08: Adjacent sibling */}
        <TestCaseViewer testCase={testCases[7]}>
          <h2>Title</h2>
          <p>Adjacent paragraph</p>
        </TestCaseViewer>
        
        {/* css-09: Attribute selector */}
        <TestCaseViewer testCase={testCases[8]}>
          <button type="submit">Submit Button</button>
        </TestCaseViewer>
        
        {/* css-10: Pseudo-class selector */}
        <TestCaseViewer testCase={testCases[9]}>
          <div>
            <div className="first-child">First child</div>
            <div>Second</div>
          </div>
        </TestCaseViewer>
        
        {/* css-11: Multiple classes */}
        <TestCaseViewer testCase={testCases[10]}>
          <button className="btn btn-primary btn-lg">Multiple Classes</button>
        </TestCaseViewer>
        
        {/* css-12: BEM naming */}
        <TestCaseViewer testCase={testCases[11]}>
          <div className="block__element--modifier">BEM Element</div>
        </TestCaseViewer>
        
        {/* css-13: Generated hash classes */}
        <TestCaseViewer testCase={testCases[12]}>
          <div className="Button_button__a1b2c3">Generated Hash</div>
        </TestCaseViewer>
        
        {/* css-14: Dynamic classes */}
        <TestCaseViewer testCase={testCases[13]}>
          <div className={isActive ? "active" : ""}>
            <button onClick={() => setIsActive(!isActive)}>Toggle</button>
            Dynamic Classes
          </div>
        </TestCaseViewer>
        
        {/* css-15: No classes or id */}
        <TestCaseViewer testCase={testCases[14]}>
          <div>Plain element with no classes or id</div>
        </TestCaseViewer>
      </div>
    </div>
  );
}

