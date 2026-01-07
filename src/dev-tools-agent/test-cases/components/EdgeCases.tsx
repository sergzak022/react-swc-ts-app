import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { TestCaseViewer } from './TestCaseViewer';
import { getTestCasesByCategory } from '../TestCaseRegistry';

// Portal component for edge-06
function PortalModal({ children }: { children: ReactNode }) {
  const portalRoot = document.getElementById('portal-root') || document.body;
  return createPortal(children, portalRoot);
}

export function EdgeCases() {
  const testCases = getTestCasesByCategory('edge');
  const portalRootRef = useRef<HTMLDivElement | null>(null);
  
  // Ensure portal root exists
  useEffect(() => {
    const existingRoot = document.getElementById('portal-root');
    if (!existingRoot) {
      const root = document.createElement('div');
      root.id = 'portal-root';
      document.body.appendChild(root);
      portalRootRef.current = root;
      
      return () => {
        // Only clean up if we created it and it still exists
        if (portalRootRef.current && document.body.contains(portalRootRef.current)) {
          document.body.removeChild(portalRootRef.current);
        }
      };
    }
  }, []);
  
  // Get infrastructure test case separately
  const infrastructureTestCase = testCases.find(tc => tc.id === 'infrastructure-01');
  
  return (
    <div className="test-category">
      <h2 className="text-2xl font-bold mb-4">Edge Cases ({testCases.length} cases)</h2>
      <div className="space-y-4">
        {/* edge-01: SVG element */}
        <TestCaseViewer testCase={testCases[0]}>
          <svg width="100" height="100">
            <path d="M10 10 L90 90" stroke="black" />
          </svg>
        </TestCaseViewer>
        
        {/* edge-02: SVG with testid */}
        <TestCaseViewer testCase={testCases[1]}>
          <svg data-testid="icon" width="100" height="100">
            <circle cx="50" cy="50" r="40" fill="blue" />
          </svg>
        </TestCaseViewer>
        
        {/* edge-03: Shadow DOM (open) */}
        <TestCaseViewer testCase={testCases[2]}>
          <div data-shadow-dom="open" className="shadow-dom-container">
            <div className="content">Shadow DOM Content</div>
          </div>
        </TestCaseViewer>
        
        {/* edge-04: Shadow DOM (closed) - expectedSelector: null */}
        <TestCaseViewer testCase={testCases[3]}>
          <div className="p-4 border-2 border-dashed border-gray-400">
            <p className="text-gray-600 italic">
              Closed shadow DOM - selector cannot be generated.
              This case demonstrates graceful failure.
            </p>
          </div>
        </TestCaseViewer>
        
        {/* edge-05: iFrame content - expectedSelector: null */}
        <TestCaseViewer testCase={testCases[4]}>
          <div className="p-4 border-2 border-dashed border-gray-400">
            <p className="text-gray-600 italic">
              iFrame content - selector cannot be generated.
              This case demonstrates graceful failure.
            </p>
          </div>
        </TestCaseViewer>
        
        {/* edge-06: Portal element */}
        <TestCaseViewer testCase={testCases[5]}>
          <PortalModal>
            <div className="modal">Portal Modal Content</div>
          </PortalModal>
        </TestCaseViewer>
        
        {/* edge-07: ARIA-labeled button */}
        <TestCaseViewer testCase={testCases[6]}>
          <button aria-label="Close">×</button>
        </TestCaseViewer>
        
        {/* edge-08: Role-based element */}
        <TestCaseViewer testCase={testCases[7]}>
          <nav role="navigation">Navigation</nav>
        </TestCaseViewer>
        
        {/* edge-09: MathML element */}
        <TestCaseViewer testCase={testCases[8]}>
          <div className="math-expression">
            <span className="math-variable">x</span>
            <span className="math-operator">=</span>
            <span className="math-number">5</span>
          </div>
        </TestCaseViewer>
        
        {/* edge-10: Custom web component */}
        <TestCaseViewer testCase={testCases[9]}>
          <div data-custom-widget="true" className="custom-widget">
            Custom Widget
          </div>
        </TestCaseViewer>
        
        {/* edge-11: Deeply nested element */}
        <TestCaseViewer testCase={testCases[10]}>
          <div>
            <div>
              <div>
                <div>
                  <div>
                    <span>Deeply nested span (20+ levels)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TestCaseViewer>
        
        {/* edge-12: Hidden element */}
        <TestCaseViewer testCase={testCases[11]}>
          <div className="hidden" style={{ display: 'none' }} data-test-case-id={testCases[11].id}>
            Hidden Element
          </div>
        </TestCaseViewer>
        
        {/* infrastructure-01: Test infrastructure exclusion */}
        {infrastructureTestCase && (
          <TestCaseViewer testCase={infrastructureTestCase}>
            <button 
              data-testid="test-button"
              data-test-case-id="infrastructure-01"
            >
              Test Button
            </button>
          </TestCaseViewer>
        )}
      </div>
    </div>
  );
}

