import { forwardRef, memo, lazy, Suspense, useRef } from 'react';
import type { ComponentType, ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';
import { TestCaseViewer } from './TestCaseViewer';
import { getTestCasesByCategory } from '../TestCaseRegistry';

// component-01: Wrapper component
function Button({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className="btn" {...props}>{children}</button>;
}

// component-02: Compound component
const Accordion = {
  Item: ({ children }: { children: ReactNode }) => (
    <div className="accordion-item">{children}</div>
  )
};

// component-03: HOC
function withAuth<T extends object>(Component: ComponentType<T>) {
  return function AuthenticatedComponent(props: T) {
    return <Component {...props} />;
  };
}
function UserProfile({ className }: { className?: string }) {
  return <div className={`user-profile ${className || ''}`}>User Profile</div>;
}
const AuthenticatedUserProfile = withAuth(UserProfile);

// component-04: Render props
function DataProvider({ render }: { render: (data: string) => ReactNode }) {
  return <>{render('data-content')}</>;
}

// component-05: Forwarded ref
const ForwardedInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
  <input ref={ref} className="forwarded" {...props} />
));

// component-06: Memoized component
const MemoizedComponent = memo(function Memoized({ className }: { className?: string }) {
  return <div className={`memoized ${className || ''}`}>Memoized</div>;
});

// component-07: Lazy-loaded component
const LazyComponent = lazy(() => Promise.resolve({
  default: () => <div className="lazy-loaded">Lazy Loaded</div>
}));

// component-08: Slot/children pattern
function Layout({ children }: { children: ReactNode }) {
  return <div className="layout">{children}</div>;
}
function Sidebar() {
  return <aside className="sidebar">Sidebar</aside>;
}

// component-09: Polymorphic component
function Box({ as: Component = 'div', className, ...props }: any) {
  return <Component className={`box ${className || ''}`} {...props} />;
}

// component-10: Styled component (simulated)
function StyledButton({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className="sc-abc123" {...props}>{children}</button>;
}

export function ComponentPatterns() {
  const testCases = getTestCasesByCategory('component');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Verify test cases match expected IDs (safety check)
  if (testCases.length !== 10 || testCases[0]?.id !== 'component-01') {
    console.warn('[ComponentPatterns] Test case order mismatch!');
  }
  
  return (
    <div className="test-category">
      <h2 className="text-2xl font-bold mb-4">Component Patterns (10 cases)</h2>
      <div className="space-y-4">
        {/* component-01: Wrapper component */}
        <TestCaseViewer testCase={testCases[0]}>
          <Button>Wrapped Button</Button>
        </TestCaseViewer>
        
        {/* component-02: Compound component */}
        <TestCaseViewer testCase={testCases[1]}>
          <Accordion.Item>Accordion Item</Accordion.Item>
        </TestCaseViewer>
        
        {/* component-03: Higher-order component */}
        <TestCaseViewer testCase={testCases[2]}>
          <AuthenticatedUserProfile />
        </TestCaseViewer>
        
        {/* component-04: Render props pattern */}
        <TestCaseViewer testCase={testCases[3]}>
          <DataProvider render={(data) => <div className="data-content">{data}</div>} />
        </TestCaseViewer>
        
        {/* component-05: Forwarded ref component */}
        <TestCaseViewer testCase={testCases[4]}>
          <ForwardedInput ref={inputRef} placeholder="Forwarded input" />
        </TestCaseViewer>
        
        {/* component-06: Memoized component */}
        <TestCaseViewer testCase={testCases[5]}>
          <MemoizedComponent />
        </TestCaseViewer>
        
        {/* component-07: Lazy-loaded component */}
        <TestCaseViewer testCase={testCases[6]}>
          <Suspense fallback={<div>Loading...</div>}>
            <LazyComponent />
          </Suspense>
        </TestCaseViewer>
        
        {/* component-08: Slot/children pattern */}
        <TestCaseViewer testCase={testCases[7]}>
          <Layout>
            <Sidebar />
          </Layout>
        </TestCaseViewer>
        
        {/* component-09: Polymorphic component */}
        <TestCaseViewer testCase={testCases[8]}>
          <Box as="button">Polymorphic Box</Box>
        </TestCaseViewer>
        
        {/* component-10: Styled component */}
        <TestCaseViewer testCase={testCases[9]}>
          <StyledButton>Styled Button</StyledButton>
        </TestCaseViewer>
      </div>
    </div>
  );
}

