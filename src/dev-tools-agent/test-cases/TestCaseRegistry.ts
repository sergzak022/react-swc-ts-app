/**
 * Test Case Registry for UI-Agent Selector & Resolver Testing
 * 
 * This registry defines all test cases for validating selector generation
 * and resolver logic. Each test case specifies expected behavior and outcomes.
 * 
 * @see docs/SELECTOR_RESOLVER_ANALYSIS_AND_TEST_PLAN.md
 */

/**
 * Test case definition with expected behavior and outcomes.
 */
export interface TestCase {
  /** Unique test case identifier (e.g., "testid-01") */
  id: string;
  
  /** Category: data-testid, css, dynamic, edge, component */
  category: string;
  
  /** Short descriptive name */
  name: string;
  
  /** Detailed description of what is being tested */
  description: string;
  
  /** Expected CSS selector to be generated (null if selector cannot be generated) */
  expectedSelector: string | null;
  
  /** Expected file path to be resolved (null if not applicable) */
  expectedFile: string | null;
  
  /** Expected confidence level from resolver */
  expectedConfidence: 'high' | 'medium' | 'low';
  
  /** Expected resolution mechanism (heuristic or agent) */
  expectedSource?: 'heuristic' | 'agent';
  
  /** If true, source mismatch is treated as an error instead of warning */
  strictSourceCheck?: boolean;
  
  /** Tags for filtering and categorization */
  tags: string[];
  
  /** Priority level (p0 = critical, p3 = nice to have) */
  priority: 'p0' | 'p1' | 'p2' | 'p3';
}

/**
 * Complete test case registry (55 test cases)
 * Organized by category for easy reference and filtering.
 */
export const TEST_CASES: TestCase[] = [
  // ========================================================================
  // Category 1: data-testid Variations (10 cases)
  // ========================================================================
  
  {
    id: 'testid-01',
    category: 'data-testid',
    name: 'Literal data-testid',
    description: 'Element with data-testid="user-button"',
    expectedSelector: '[data-testid="user-button"]',
    expectedFile: 'src/dev-tools-agent/test-cases/components/TestIdVariations.tsx',
    expectedConfidence: 'high',
    tags: ['testid', 'literal', 'stable', 'basic'],
    priority: 'p0'
  },
  
  {
    id: 'testid-02',
    category: 'data-testid',
    name: 'Constant data-testid',
    description: 'data-testid={BUTTON_ID} where const BUTTON_ID = "action-btn"',
    expectedSelector: '[data-testid="action-btn"]',
    expectedFile: 'src/dev-tools-agent/test-cases/components/TestIdVariations.tsx',
    expectedConfidence: 'high',
    tags: ['testid', 'constant', 'stable'],
    priority: 'p0'
  },
  
  {
    id: 'testid-03',
    category: 'data-testid',
    name: 'Namespaced data-testid',
    description: 'data-testid={TestIds.SUBMIT}',
    expectedSelector: '[data-testid="submit-button"]',
    expectedFile: 'src/dev-tools-agent/test-cases/components/TestIdVariations.tsx',
    expectedConfidence: 'high',
    tags: ['testid', 'namespaced', 'stable'],
    priority: 'p0'
  },
  
  {
    id: 'testid-04',
    category: 'data-testid',
    name: 'Function-generated testid',
    description: 'data-testid={TestIds.item("user")}',
    expectedSelector: '[data-testid="item-user"]',
    expectedFile: 'src/dev-tools-agent/test-cases/components/TestIdVariations.tsx',
    expectedConfidence: 'high',
    tags: ['testid', 'function', 'dynamic', 'stable'],
    priority: 'p0'
  },
  
  {
    id: 'testid-05',
    category: 'data-testid',
    name: 'Nested element with parent testid',
    description: 'Span inside div with data-testid',
    expectedSelector: '[data-testid="card"] span',
    expectedFile: 'src/dev-tools-agent/test-cases/components/TestIdVariations.tsx',
    expectedConfidence: 'medium',
    tags: ['testid', 'nested', 'ancestor'],
    priority: 'p1'
  },
  
  {
    id: 'testid-06',
    category: 'data-testid',
    name: 'Distant ancestor testid',
    description: 'Element 5 levels deep from testid',
    expectedSelector: '[data-testid="container"] div > div > div > div > span',
    expectedFile: 'src/dev-tools-agent/test-cases/components/TestIdVariations.tsx',
    expectedConfidence: 'low',
    tags: ['testid', 'nested', 'deep', 'ancestor'],
    priority: 'p2'
  },
  
  {
    id: 'testid-07',
    category: 'data-testid',
    name: 'Duplicate testid values',
    description: 'Multiple elements with same testid',
    expectedSelector: '[data-testid="duplicate"]',
    expectedFile: 'src/dev-tools-agent/test-cases/components/TestIdVariations.tsx',
    expectedConfidence: 'medium',
    tags: ['testid', 'duplicate', 'ambiguous'],
    priority: 'p1'
  },
  
  {
    id: 'testid-08',
    category: 'data-testid',
    name: 'Template literal testid',
    description: 'data-testid={`card-${id}`}',
    expectedSelector: '[data-testid="card-123"]',
    expectedFile: 'src/dev-tools-agent/test-cases/components/TestIdVariations.tsx',
    expectedConfidence: 'medium',
    tags: ['testid', 'template-literal', 'dynamic'],
    priority: 'p1'
  },
  
  {
    id: 'testid-09',
    category: 'data-testid',
    name: 'Prop-passed testid',
    description: '<Component testId={value} />',
    expectedSelector: '[data-testid="prop-passed"]',
    expectedFile: 'src/dev-tools-agent/test-cases/components/TestIdVariations.tsx',
    expectedConfidence: 'high',
    tags: ['testid', 'props', 'component'],
    priority: 'p1'
  },
  
  {
    id: 'testid-10',
    category: 'data-testid',
    name: 'Spread testid',
    description: '{...testIdProps}',
    expectedSelector: '[data-testid="spread-props"]',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['testid', 'spread', 'complex'],
    priority: 'p2'
  },
  
  // ========================================================================
  // Category 2: CSS Selector Scenarios (15 cases)
  // ========================================================================
  
  {
    id: 'css-01',
    category: 'css',
    name: 'Unique ID selector',
    description: 'id="main-header"',
    expectedSelector: '#main-header',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['css', 'id', 'selector'],
    priority: 'p1'
  },
  
  {
    id: 'css-02',
    category: 'css',
    name: 'Class-based selector',
    description: 'button.btn-primary.large',
    expectedSelector: 'button.btn-primary.large',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['css', 'class', 'selector'],
    priority: 'p1'
  },
  
  {
    id: 'css-03',
    category: 'css',
    name: 'CSS Module classes',
    description: 'className={styles.card}',
    expectedSelector: 'div.card_abc123', // hash will vary
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['css', 'css-modules', 'hash'],
    priority: 'p0'
  },
  
  {
    id: 'css-04',
    category: 'css',
    name: 'Tailwind utility classes',
    description: 'div with many Tailwind classes',
    expectedSelector: 'div.flex.items-center.justify-between',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['css', 'tailwind', 'utility'],
    priority: 'p0'
  },
  
  {
    id: 'css-05',
    category: 'css',
    name: 'nth-of-type selector',
    description: '3rd button among siblings',
    expectedSelector: 'button:nth-of-type(3)',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['css', 'nth-of-type', 'positional'],
    priority: 'p2'
  },
  
  {
    id: 'css-06',
    category: 'css',
    name: 'nth-child selector',
    description: 'Mixed sibling types',
    expectedSelector: 'div > *:nth-child(2)',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['css', 'nth-child', 'positional'],
    priority: 'p2'
  },
  
  {
    id: 'css-07',
    category: 'css',
    name: 'Compound selector',
    description: 'div.container > button.submit',
    expectedSelector: 'div.container > button.submit',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['css', 'compound', 'hierarchy'],
    priority: 'p2'
  },
  
  {
    id: 'css-08',
    category: 'css',
    name: 'Adjacent sibling',
    description: 'h2 + p',
    expectedSelector: 'h2 + p',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['css', 'adjacent-sibling', 'positional'],
    priority: 'p3'
  },
  
  {
    id: 'css-09',
    category: 'css',
    name: 'Attribute selector',
    description: '[type="submit"]',
    expectedSelector: '[type="submit"]',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['css', 'attribute', 'selector'],
    priority: 'p2'
  },
  
  {
    id: 'css-10',
    category: 'css',
    name: 'Pseudo-class selector',
    description: ':first-child, :last-child',
    expectedSelector: 'div:first-child',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['css', 'pseudo-class', 'positional'],
    priority: 'p3'
  },
  
  {
    id: 'css-11',
    category: 'css',
    name: 'Multiple classes',
    description: '.btn.btn-primary.btn-lg',
    expectedSelector: '.btn.btn-primary.btn-lg',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['css', 'class', 'multiple'],
    priority: 'p2'
  },
  
  {
    id: 'css-12',
    category: 'css',
    name: 'BEM naming',
    description: '.block__element--modifier',
    expectedSelector: '.block__element--modifier',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['css', 'bem', 'convention'],
    priority: 'p2'
  },
  
  {
    id: 'css-13',
    category: 'css',
    name: 'Generated hash classes',
    description: '.Button_button__a1b2c3',
    expectedSelector: '.Button_button__a1b2c3',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['css', 'hash', 'generated'],
    priority: 'p1'
  },
  
  {
    id: 'css-14',
    category: 'css',
    name: 'Dynamic classes',
    description: 'className={isActive ? "active" : ""}',
    expectedSelector: 'div.active',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['css', 'dynamic', 'conditional'],
    priority: 'p2'
  },
  
  {
    id: 'css-15',
    category: 'css',
    name: 'No classes or id',
    description: 'Plain <div> element',
    expectedSelector: 'div',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['css', 'minimal', 'plain'],
    priority: 'p2'
  },
  
  // ========================================================================
  // Category 3: Dynamic Content (8 cases)
  // ========================================================================
  
  {
    id: 'dynamic-01',
    category: 'dynamic',
    name: 'List item without testid',
    description: '<li> in <ul> without testid',
    expectedSelector: 'ul > li:nth-of-type(2)',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['dynamic', 'list', 'no-testid'],
    priority: 'p1'
  },
  
  {
    id: 'dynamic-02',
    category: 'dynamic',
    name: 'Map-rendered items with index',
    description: 'data-testid={`item-${index}`}',
    expectedSelector: '[data-testid="item-5"]',
    expectedFile: 'src/dev-tools-agent/test-cases/components/DynamicContent.tsx',
    expectedConfidence: 'medium',
    tags: ['dynamic', 'map', 'index', 'testid'],
    priority: 'p1'
  },
  
  {
    id: 'dynamic-03',
    category: 'dynamic',
    name: 'Conditionally rendered element',
    description: '{condition && <div>...</div>}',
    expectedSelector: 'div.conditional',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['dynamic', 'conditional', 'render'],
    priority: 'p2'
  },
  
  {
    id: 'dynamic-04',
    category: 'dynamic',
    name: 'Ternary rendered element',
    description: '{condition ? <A /> : <B />}',
    expectedSelector: 'div.variant-a',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['dynamic', 'ternary', 'conditional'],
    priority: 'p2'
  },
  
  {
    id: 'dynamic-05',
    category: 'dynamic',
    name: 'Virtualized list item',
    description: 'React Virtual, react-window',
    expectedSelector: 'div[role="listitem"]',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['dynamic', 'virtualized', 'list', 'library'],
    priority: 'p3'
  },
  
  {
    id: 'dynamic-06',
    category: 'dynamic',
    name: 'Sortable list item',
    description: 'Drag-and-drop reorderable',
    expectedSelector: 'div.sortable-item',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['dynamic', 'sortable', 'drag-drop'],
    priority: 'p3'
  },
  
  {
    id: 'dynamic-07',
    category: 'dynamic',
    name: 'Filtered list item',
    description: 'Search/filter results',
    expectedSelector: 'div.filtered-item',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['dynamic', 'filtered', 'search'],
    priority: 'p2'
  },
  
  {
    id: 'dynamic-08',
    category: 'dynamic',
    name: 'Paginated content',
    description: 'Item on page 2',
    expectedSelector: 'div.paginated-item',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['dynamic', 'paginated', 'navigation'],
    priority: 'p3'
  },
  
  // ========================================================================
  // Category 4: Edge Cases (12 cases)
  // ========================================================================
  
  {
    id: 'edge-01',
    category: 'edge',
    name: 'SVG element',
    description: '<path> inside <svg>',
    expectedSelector: 'svg > path',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['edge', 'svg', 'graphics'],
    priority: 'p2'
  },
  
  {
    id: 'edge-02',
    category: 'edge',
    name: 'SVG with testid',
    description: '<svg data-testid="icon">',
    expectedSelector: '[data-testid="icon"]',
    expectedFile: 'src/dev-tools-agent/test-cases/components/EdgeCases.tsx',
    expectedConfidence: 'high',
    tags: ['edge', 'svg', 'testid'],
    priority: 'p1'
  },
  
  {
    id: 'edge-03',
    category: 'edge',
    name: 'Shadow DOM (open)',
    description: 'Element inside open shadow root',
    expectedSelector: 'custom-element >>> div.content',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['edge', 'shadow-dom', 'web-components'],
    priority: 'p2'
  },
  
  {
    id: 'edge-04',
    category: 'edge',
    name: 'Shadow DOM (closed)',
    description: 'Element inside closed shadow root',
    expectedSelector: null,
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['edge', 'shadow-dom', 'closed', 'fail'],
    priority: 'p3'
  },
  
  {
    id: 'edge-05',
    category: 'edge',
    name: 'iFrame content',
    description: 'Element inside iframe',
    expectedSelector: null,
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['edge', 'iframe', 'embedded', 'fail'],
    priority: 'p3'
  },
  
  {
    id: 'edge-06',
    category: 'edge',
    name: 'Portal element',
    description: 'React Portal to body',
    expectedSelector: 'div#portal-root > div.modal',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['edge', 'portal', 'react'],
    priority: 'p2'
  },
  
  {
    id: 'edge-07',
    category: 'edge',
    name: 'ARIA-labeled button',
    description: 'aria-label="Close"',
    expectedSelector: 'button[aria-label="Close"]',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['edge', 'aria', 'accessibility'],
    priority: 'p1'
  },
  
  {
    id: 'edge-08',
    category: 'edge',
    name: 'Role-based element',
    description: 'role="navigation"',
    expectedSelector: '[role="navigation"]',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['edge', 'aria', 'role', 'accessibility'],
    priority: 'p2'
  },
  
  {
    id: 'edge-09',
    category: 'edge',
    name: 'MathML element',
    description: 'Math notation',
    expectedSelector: 'math > mrow',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['edge', 'mathml', 'special'],
    priority: 'p3'
  },
  
  {
    id: 'edge-10',
    category: 'edge',
    name: 'Custom web component',
    description: '<my-widget>',
    expectedSelector: 'my-widget',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['edge', 'web-components', 'custom'],
    priority: 'p2'
  },
  
  {
    id: 'edge-11',
    category: 'edge',
    name: 'Deeply nested element',
    description: '20+ levels deep',
    expectedSelector: 'div > div > div > div > div > span',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['edge', 'nested', 'deep'],
    priority: 'p3'
  },
  
  {
    id: 'edge-12',
    category: 'edge',
    name: 'Hidden element',
    description: 'display: none or visibility: hidden',
    expectedSelector: 'div.hidden',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['edge', 'hidden', 'visibility'],
    priority: 'p3'
  },
  
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
  },
  
  // ========================================================================
  // Category 5: Component Patterns (10 cases)
  // ========================================================================
  
  {
    id: 'component-01',
    category: 'component',
    name: 'Wrapper component',
    description: '<Button> wrapping native <button>',
    expectedSelector: 'button.btn',
    expectedFile: 'src/dev-tools-agent/test-cases/components/ComponentPatterns.tsx',
    expectedConfidence: 'medium',
    tags: ['component', 'wrapper', 'abstraction'],
    priority: 'p1'
  },
  
  {
    id: 'component-02',
    category: 'component',
    name: 'Compound component',
    description: '<Accordion.Item>',
    expectedSelector: 'div.accordion-item',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['component', 'compound', 'pattern'],
    priority: 'p2'
  },
  
  {
    id: 'component-03',
    category: 'component',
    name: 'Higher-order component',
    description: 'withAuth(UserProfile)',
    expectedSelector: 'div.user-profile',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['component', 'hoc', 'pattern'],
    priority: 'p2'
  },
  
  {
    id: 'component-04',
    category: 'component',
    name: 'Render props pattern',
    description: '<DataProvider render={...} />',
    expectedSelector: 'div.data-content',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['component', 'render-props', 'pattern'],
    priority: 'p3'
  },
  
  {
    id: 'component-05',
    category: 'component',
    name: 'Forwarded ref component',
    description: 'forwardRef wrapper',
    expectedSelector: 'input.forwarded',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['component', 'forwardRef', 'react'],
    priority: 'p2'
  },
  
  {
    id: 'component-06',
    category: 'component',
    name: 'Memoized component',
    description: 'React.memo(Component)',
    expectedSelector: 'div.memoized',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['component', 'memo', 'optimization'],
    priority: 'p3'
  },
  
  {
    id: 'component-07',
    category: 'component',
    name: 'Lazy-loaded component',
    description: 'React.lazy(() => import())',
    expectedSelector: 'div.lazy-loaded',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['component', 'lazy', 'code-splitting'],
    priority: 'p3'
  },
  
  {
    id: 'component-08',
    category: 'component',
    name: 'Slot/children pattern',
    description: '<Layout><Sidebar /></Layout>',
    expectedSelector: 'aside.sidebar',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['component', 'slots', 'children', 'composition'],
    priority: 'p2'
  },
  
  {
    id: 'component-09',
    category: 'component',
    name: 'Polymorphic component',
    description: '<Box as="button">',
    expectedSelector: 'button.box',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['component', 'polymorphic', 'pattern'],
    priority: 'p3'
  },
  
  {
    id: 'component-10',
    category: 'component',
    name: 'Styled component',
    description: 'styled.button`...`',
    expectedSelector: 'button.sc-abc123',
    expectedFile: null,
    expectedConfidence: 'low',
    tags: ['component', 'styled-components', 'css-in-js'],
    priority: 'p2'
  },
];

/**
 * Helper functions for working with test cases
 */

/** Get test cases by category */
export function getTestCasesByCategory(category: string): TestCase[] {
  return TEST_CASES.filter(tc => tc.category === category);
}

/** Get test case by ID */
export function getTestCaseById(id: string): TestCase | undefined {
  return TEST_CASES.find(tc => tc.id === id);
}

/** Get test cases by tag */
export function getTestCasesByTag(tag: string): TestCase[] {
  return TEST_CASES.filter(tc => tc.tags.includes(tag));
}

/** Get test cases by priority */
export function getTestCasesByPriority(priority: TestCase['priority']): TestCase[] {
  return TEST_CASES.filter(tc => tc.priority === priority);
}

/** Get test case statistics */
export function getTestCaseStats() {
  return {
    total: TEST_CASES.length,
    byCategory: {
      'data-testid': getTestCasesByCategory('data-testid').length,
      'css': getTestCasesByCategory('css').length,
      'dynamic': getTestCasesByCategory('dynamic').length,
      'edge': getTestCasesByCategory('edge').length,
      'component': getTestCasesByCategory('component').length,
    },
    byHeuristicCapability: {
      'resolvable': TEST_CASES.filter(tc => tc.expectedFile !== null).length,
      'unresolvable': TEST_CASES.filter(tc => tc.expectedFile === null).length,
    },
    byConfidence: {
      'high': TEST_CASES.filter(tc => tc.expectedConfidence === 'high').length,
      'medium': TEST_CASES.filter(tc => tc.expectedConfidence === 'medium').length,
      'low': TEST_CASES.filter(tc => tc.expectedConfidence === 'low').length,
    },
    byPriority: {
      'p0': getTestCasesByPriority('p0').length,
      'p1': getTestCasesByPriority('p1').length,
      'p2': getTestCasesByPriority('p2').length,
      'p3': getTestCasesByPriority('p3').length,
    }
  };
}

