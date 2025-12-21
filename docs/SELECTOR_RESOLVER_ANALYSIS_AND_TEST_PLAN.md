# Selector & Resolver Analysis and Testing Plan

## Document Overview

This document provides a comprehensive analysis of the current selector and resolver logic in UI-Agent, identifies strengths and weaknesses, and outlines a detailed testing plan to validate coverage and identify gaps.

**Date:** 2025-12-13  
**Version:** 1.1  
**Status:** Phase 1 Complete - Implementation In Progress

---

## Table of Contents

1. [Current Implementation Analysis](#current-implementation-analysis)
2. [Selector Logic Analysis](#selector-logic-analysis)
3. [Resolver Logic Analysis](#resolver-logic-analysis)
4. [Test Case Matrix](#test-case-matrix)
5. [Testing Infrastructure Plan](#testing-infrastructure-plan)
6. [Implementation Timeline](#implementation-timeline)
7. [Success Metrics](#success-metrics)

---

## Current Implementation Analysis

### Selector Generation Flow

**Location:** `src/dev-tools-agent/utils/buildSelector.ts`

**Algorithm:**
1. Check for `data-testid` (on element or ancestors)
2. Validate uniqueness
3. Fall back to ID-based selector
4. Fall back to path-based selector (tag + classes + nth-of-type)

### Resolver Chain Flow

**Location:** `server/resolvers/index.ts`

**Chain:**
1. **testIdResolver** - Searches for data-testid in source files (4 phases)
2. **cursorCliResolver** - AI fallback when heuristics fail or return low confidence

---

## Selector Logic Analysis

### ✅ Strengths

| Feature | Implementation | Works Well For |
|---------|---------------|----------------|
| **data-testid Priority** | First priority in selector generation | Stable, semantic test identifiers |
| **Unique Selector Validation** | Validates selectors with `querySelectorAll` | Ensures exact element targeting |
| **Shadow DOM Support** | Uses `deepElementFromPoint` recursion | Open shadow root elements |
| **Progressive Refinement** | Tries simpler selectors before complex | Readable, maintainable selectors |
| **CSS Escaping** | Uses `CSS.escape()` for special chars | IDs/classes with special characters |
| **Ancestor Fallback** | Can use testId from parent elements | Components without direct testId |
| **nth-of-type Support** | Adds positional selectors when needed | Multiple similar siblings |

### ❌ Weaknesses & Gaps

| Gap | Impact | Example Scenario |
|-----|--------|------------------|
| **No ARIA Attribute Support** | Misses accessible elements | `<button aria-label="Close">×</button>` |
| **Limited nth-child Logic** | Cannot handle mixed element types | `<div><span></span><button></button></div>` |
| **Dynamic Content Issues** | Path selectors break with reordering | List items, grid cells, tabs |
| **iFrame Blindness** | Cannot traverse iframe boundaries | Embedded content, widgets |
| **Class Instability** | Uses generated classes (Tailwind, CSS Modules) | `.btn_abc123`, `.flex.items-center` |
| **No Text-Based Selectors** | Cannot use visible text for matching | Buttons, links, labels |
| **Closed Shadow DOM** | Cannot penetrate closed shadow roots | Web Components with closed mode |
| **SVG Element Handling** | May struggle with SVG namespaces | Icons, charts, diagrams |
| **No Semantic Priority** | Doesn't prefer semantic HTML | `<nav>`, `<main>`, `<article>` |
| **Portal Elements** | May lose context with React Portals | Modals, tooltips, dropdowns |

### Priority Improvements Needed

1. **High Priority:**
   - ARIA attribute support (`aria-label`, `aria-labelledby`, `role`)
   - Text-based selector fallback (`:contains()` equivalent)
   - Better handling of dynamic lists

2. **Medium Priority:**
   - CSS Module class resolution (map back to source)
   - Semantic HTML prioritization
   - Portal-aware selection

3. **Low Priority:**
   - iframe traversal (requires special handling)
   - Closed shadow DOM (impossible without access)

---

## Resolver Logic Analysis

### ✅ Strengths

| Feature | Implementation | Works Well For |
|---------|---------------|----------------|
| **Multi-Phase testId Search** | 4-phase progressive search | Literals, constants, namespaced, functions |
| **Confidence Scoring** | Smart scoring based on match quality | User verification workflow |
| **File Validation** | Verifies files exist | Prevents hallucinated paths |
| **Code Snippet Extraction** | Shows 21 lines of context | Visual verification |
| **AI Fallback** | Cursor CLI for complex cases | Unstructured components |
| **Source Tracking** | Distinguishes heuristic vs AI | Trust levels |

### ❌ Weaknesses & Gaps

| Gap | Impact | Example Scenario |
|-----|--------|------------------|
| **No CSS Class Resolver** | Misses `className={styles.button}` | CSS Modules, styled-components |
| **No Component Name Matching** | Doesn't match `<Button>` to `Button.tsx` | Convention-based routing |
| **No JSX Tag Matching** | Doesn't search for `<button` tags | Plain HTML elements |
| **No Import Path Analysis** | Doesn't trace component imports | Compound components, HOCs |
| **Single Line Matching** | Misses multi-line JSX attributes | Complex component props |
| **No Prop-Based Resolution** | Doesn't use other props for matching | `onClick={handleSubmit}`, `href="/users"` |
| **Monorepo Blindness** | Doesn't understand package boundaries | Shared component libraries |
| **Build Tool Ignorance** | Doesn't resolve aliases (`@/components`) | Modern project structures |
| **No Component Composition** | Doesn't trace through wrappers | HOCs, render props, children |
| **Generic Cursor Prompt** | Doesn't leverage codebase context | AI resolution quality |

### Priority Improvements Needed

1. **High Priority:**
   - CSS class resolver (map `className={styles.X}` to source)
   - Component name matching (`<Button>` → `Button.tsx`)
   - JSX tag search (find `<button` when selector is `button`)

2. **Medium Priority:**
   - Import alias resolution (`@/components` → `src/components`)
   - Multi-line JSX attribute matching
   - Enhanced Cursor CLI prompt with codebase context

3. **Low Priority:**
   - Monorepo package boundary detection
   - Component composition tracing
   - Prop-based resolution heuristics

---

## Test Case Matrix

### Test Categories

1. **data-testid Variations** (10 cases)
2. **CSS Selector Scenarios** (15 cases)
3. **Dynamic Content** (8 cases)
4. **Edge Cases** (12 cases)
5. **Component Patterns** (10 cases)

**Total:** 55 test cases covering common scenarios and edge cases

### Detailed Test Cases

#### Category 1: data-testid Variations (10 cases)

| ID | Name | Description | Expected Result |
|----|------|-------------|-----------------|
| `testid-01` | Literal data-testid | `data-testid="user-button"` | High confidence, heuristic |
| `testid-02` | Constant data-testid | `data-testid={BUTTON_ID}` where `const BUTTON_ID = "action-btn"` | High confidence, heuristic |
| `testid-03` | Namespaced data-testid | `data-testid={TestIds.SUBMIT}` | High confidence, heuristic |
| `testid-04` | Function-generated testid | `data-testid={TestIds.item("user")}` | High confidence, heuristic |
| `testid-05` | Nested element with parent testid | Span inside div with data-testid | Medium confidence, heuristic |
| `testid-06` | Distant ancestor testid | Element 5 levels deep from testid | Low confidence, heuristic |
| `testid-07` | Duplicate testid values | Multiple elements with same testid | Medium confidence, heuristic |
| `testid-08` | Template literal testid | `` data-testid={`card-${id}`} `` | Medium confidence, heuristic |
| `testid-09` | Prop-passed testid | `<Component testId={value} />` | High confidence, heuristic |
| `testid-10` | Spread testid | `{...testIdProps}` | Low confidence, cursor-cli |

#### Category 2: CSS Selector Scenarios (15 cases)

| ID | Name | Description | Expected Result |
|----|------|-------------|-----------------|
| `css-01` | Unique ID selector | `id="main-header"` | Low confidence, cursor-cli |
| `css-02` | Class-based selector | `button.btn-primary.large` | Low confidence, cursor-cli |
| `css-03` | CSS Module classes | `className={styles.card}` | Low confidence, cursor-cli |
| `css-04` | Tailwind utility classes | Many utility classes | Low confidence, cursor-cli |
| `css-05` | nth-of-type selector | 3rd button among siblings | Low confidence, cursor-cli |
| `css-06` | nth-child selector | Mixed sibling types | Low confidence, cursor-cli |
| `css-07` | Compound selector | `div.container > button.submit` | Low confidence, cursor-cli |
| `css-08` | Adjacent sibling | `h2 + p` | Low confidence, cursor-cli |
| `css-09` | Attribute selector | `[type="submit"]` | Low confidence, cursor-cli |
| `css-10` | Pseudo-class selector | `:first-child`, `:last-child` | Low confidence, cursor-cli |
| `css-11` | Multiple classes | `.btn.btn-primary.btn-lg` | Low confidence, cursor-cli |
| `css-12` | BEM naming | `.block__element--modifier` | Low confidence, cursor-cli |
| `css-13` | Generated hash classes | `.Button_button__a1b2c3` | Low confidence, cursor-cli |
| `css-14` | Dynamic classes | `className={isActive ? 'active' : ''}` | Low confidence, cursor-cli |
| `css-15` | No classes or id | Plain `<div>` element | Low confidence, cursor-cli |

#### Category 3: Dynamic Content (8 cases)

| ID | Name | Description | Expected Result |
|----|------|-------------|-----------------|
| `dynamic-01` | List item without testid | `<li>` in `<ul>` without testid | Low confidence, cursor-cli |
| `dynamic-02` | Map-rendered items with index | `data-testid={\`item-${index}\`}` | Medium confidence, heuristic |
| `dynamic-03` | Conditionally rendered element | `{condition && <div>...</div>}` | Low confidence, cursor-cli |
| `dynamic-04` | Ternary rendered element | `{condition ? <A /> : <B />}` | Low confidence, cursor-cli |
| `dynamic-05` | Virtualized list item | React Virtual, react-window | Low confidence, cursor-cli |
| `dynamic-06` | Sortable list item | Drag-and-drop reorderable | Low confidence, cursor-cli |
| `dynamic-07` | Filtered list item | Search/filter results | Low confidence, cursor-cli |
| `dynamic-08` | Paginated content | Item on page 2 | Low confidence, cursor-cli |

#### Category 4: Edge Cases (12 cases)

| ID | Name | Description | Expected Result |
|----|------|-------------|-----------------|
| `edge-01` | SVG element | `<path>` inside `<svg>` | Low confidence, cursor-cli |
| `edge-02` | SVG with testid | `<svg data-testid="icon">` | High confidence, heuristic |
| `edge-03` | Shadow DOM (open) | Element inside open shadow root | Low confidence, cursor-cli |
| `edge-04` | Shadow DOM (closed) | Element inside closed shadow root | Fail gracefully |
| `edge-05` | iFrame content | Element inside iframe | Fail gracefully |
| `edge-06` | Portal element | React Portal to body | Low confidence, cursor-cli |
| `edge-07` | ARIA-labeled button | `aria-label="Close"` | Low confidence, cursor-cli |
| `edge-08` | Role-based element | `role="navigation"` | Low confidence, cursor-cli |
| `edge-09` | MathML element | Math notation | Low confidence, cursor-cli |
| `edge-10` | Custom web component | `<my-widget>` | Low confidence, cursor-cli |
| `edge-11` | Deeply nested element | 20+ levels deep | Low confidence, cursor-cli |
| `edge-12` | Hidden element | `display: none` or `visibility: hidden` | Low confidence, cursor-cli |

#### Category 5: Component Patterns (10 cases)

| ID | Name | Description | Expected Result |
|----|------|-------------|-----------------|
| `component-01` | Wrapper component | `<Button>` wrapping native `<button>` | Medium confidence, cursor-cli |
| `component-02` | Compound component | `<Accordion.Item>` | Low confidence, cursor-cli |
| `component-03` | Higher-order component | `withAuth(UserProfile)` | Low confidence, cursor-cli |
| `component-04` | Render props pattern | `<DataProvider render={...} />` | Low confidence, cursor-cli |
| `component-05` | Forwarded ref component | `forwardRef` wrapper | Low confidence, cursor-cli |
| `component-06` | Memoized component | `React.memo(Component)` | Low confidence, cursor-cli |
| `component-07` | Lazy-loaded component | `React.lazy(() => import())` | Low confidence, cursor-cli |
| `component-08` | Slot/children pattern | `<Layout><Sidebar /></Layout>` | Low confidence, cursor-cli |
| `component-09` | Polymorphic component | `<Box as="button">` | Low confidence, cursor-cli |
| `component-10` | Styled component | `styled.button\`...\`` | Low confidence, cursor-cli |

---

## Testing Infrastructure Plan

### Phase 1: Test Case Registry ✅ **COMPLETE**

**Status:** ✅ Completed  
**File:** `src/dev-tools-agent/test-cases/TestCaseRegistry.ts`  
**Date Completed:** 2025-12-13

**Deliverables:**
- ✅ TypeScript `TestCase` interface with all required fields
- ✅ Complete registry of all 55 test cases organized by category
- ✅ Helper functions for filtering and querying test cases
- ✅ Statistics function for test case overview

**Test Case Breakdown:**
- **data-testid Variations:** 10 cases
- **CSS Selector Scenarios:** 15 cases
- **Dynamic Content:** 8 cases
- **Edge Cases:** 12 cases
- **Component Patterns:** 10 cases

**Helper Functions Implemented:**
- `getTestCasesByCategory(category: string)` - Filter by category
- `getTestCaseById(id: string)` - Get specific test case
- `getTestCasesByTag(tag: string)` - Filter by tag
- `getTestCasesByPriority(priority)` - Filter by priority
- `getTestCasesBySource(source)` - Filter by expected source
- `getTestCaseStats()` - Get comprehensive statistics

**Interface Definition:**
```typescript
export interface TestCase {
  id: string;
  category: string;
  name: string;
  description: string;
  expectedSelector: string | null;
  expectedFile: string | null;
  expectedConfidence: 'high' | 'medium' | 'low';
  // Note: expectedSource removed - use expectedFile (null = heuristics can't resolve)
  // and expectedConfidence to determine heuristic capability
  tags: string[];
  priority: 'p0' | 'p1' | 'p2' | 'p3';
}

export const TEST_CASES: TestCase[] = [
  // All 55 test cases defined and documented
];
```

### Phase 2: Test Component Library

**Directory:** `src/dev-tools-agent/test-cases/components/`

Create React components for each category:

```
components/
├── TestIdVariations.tsx       # 10 testid patterns
├── CssSelectorScenarios.tsx   # 15 CSS selector cases
├── DynamicContent.tsx          # 8 dynamic content cases
├── EdgeCases.tsx               # 12 edge cases
├── ComponentPatterns.tsx       # 10 component patterns
└── TestCaseViewer.tsx          # Wrapper component with metadata
```

Each test component renders its test cases with:
- Visual indicator (colored border)
- Test case ID overlay
- Metadata tooltip
- Click handler to trigger resolution

### Phase 3: Test Dashboard Page

**File:** `src/dev-tools-agent/test-cases/TestDashboard.tsx`

Interactive dashboard displaying:

1. **Agent Fallback Toggle (REQUIRED):**
   - Prominent checkbox to enable/disable agent fallback
   - **Default: disabled** (to avoid API costs in automated tests)
   - Warning message: "Uses API credits. Only enable for manual testing."
   - This flag controls whether `useAgentFallback` is passed to the resolution API

2. **Overview Section:**
   - Total test cases
   - Pass/fail/pending counts
   - Success rate percentage
   - Average confidence score

3. **Category Breakdown:**
   - Accordion for each category
   - Status indicators (✅ ⚠️ ❌)
   - Expandable test case details

4. **Test Runner:**
   - "Run All Tests" button (respects agent fallback toggle)
   - Individual test execution (respects agent fallback toggle)
   - Real-time progress
   - Result streaming

5. **Results Display:**
   - Expected vs actual comparison
   - Confidence score visualization
   - Code snippet preview
   - Time to resolve

6. **Filters & Search:**
   - Filter by category
   - Filter by status (pass/fail)
   - Filter by confidence level
   - Search by test ID or name

### Phase 4: Automated Test Suite

**File:** `src/dev-tools-agent/test-cases/__tests__/resolution.test.ts`

Jest/Playwright tests for CI:

```typescript
describe('Selector & Resolver Tests', () => {
  describe('data-testid variations', () => {
    TEST_CASES.filter(tc => tc.category === 'data-testid').forEach(testCase => {
      it(`${testCase.id}: ${testCase.name}`, async () => {
        // IMPORTANT: useAgentFallback = false for automated tests (no API costs)
        const result = await runTestCase(testCase, false);
        
        expect(result.confidence).toBe(testCase.expectedConfidence);
        
        // Only check file path if heuristics are expected to resolve it
        if (testCase.expectedFile) {
          expect(result.filePath).toContain(testCase.expectedFile);
          expect(result.source).toBe('heuristic');
        } else {
          // Heuristics can't resolve - expect low confidence heuristic result
          expect(result.source).toBe('heuristic');
          expect(result.confidence).toBe('low');
        }
      });
    });
  });
  
  // Repeat for each category
});
```

**Important Notes:**
- All automated tests MUST use `useAgentFallback = false` to avoid API costs
- The test dashboard MUST include a toggle to enable/disable agent fallback for manual testing
- The `runTestCase` utility MUST accept a `useAgentFallback` parameter (default: `false`)
- Test cases with `expectedFile: null` indicate heuristics cannot resolve them

### Phase 5: Metrics & Reporting

**Features:**
- JSON export of test results
- CSV export for analysis
- Chart visualizations (success rate over time)
- Performance metrics (resolution time)
- Regression detection
- GitHub issue creation for failures

---

## Implementation Timeline

### Sprint 1: Infrastructure (Week 1)

**Days 1-2: Test Registry & Components**
- [x] Create TestCaseRegistry.ts with all 55 test cases ✅ **COMPLETE**
- [ ] Create base TestCaseViewer component
- [ ] Setup routing for `/dev-tools-agent/test-cases`

**Days 3-4: Test Components**
- [ ] Implement TestIdVariations.tsx (10 cases)
- [ ] Implement CssSelectorScenarios.tsx (15 cases)
- [ ] Implement DynamicContent.tsx (8 cases)

**Day 5: Edge Cases & Component Patterns**
- [ ] Implement EdgeCases.tsx (12 cases)
- [ ] Implement ComponentPatterns.tsx (10 cases)

### Sprint 2: Dashboard & Testing (Week 2)

**Days 1-2: Test Dashboard**
- [ ] Create TestDashboard layout
- [ ] Implement test runner logic
- [ ] Build results display UI
- [ ] Add filters and search

**Days 3-4: Automated Tests**
- [ ] Write Jest tests for all categories
- [ ] Add Playwright E2E tests
- [ ] Configure CI pipeline
- [ ] Add regression detection

**Day 5: Metrics & Polish**
- [ ] Implement metrics tracking
- [ ] Add export functionality
- [ ] Create visualizations
- [ ] Documentation

### Sprint 3: Analysis & Improvements (Week 3)

**Days 1-2: Run Complete Test Suite**
- [ ] Execute all 55 test cases
- [ ] Document actual results
- [ ] Identify patterns of failure
- [ ] Categorize gaps by priority

**Days 3-4: Gap Analysis**
- [ ] Analyze high-priority gaps
- [ ] Design solutions for top 5 issues
- [ ] Estimate effort for improvements
- [ ] Create implementation roadmap

**Day 5: Documentation & Presentation**
- [ ] Update DEV_UI_AGENT_PROGRESS.md
- [ ] Create gap analysis report
- [ ] Prioritize next milestones
- [ ] Present findings

---

## Success Metrics

### Quantitative Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Test Coverage** | 55 test cases | Count of implemented cases |
| **Pass Rate - data-testid** | ≥ 90% | High confidence matches |
| **Pass Rate - CSS** | ≥ 40% | Reasonable AI fallback |
| **Pass Rate - Overall** | ≥ 60% | Combined success rate |
| **Avg Resolution Time** | < 2 seconds | Heuristic resolution |
| **Avg AI Fallback Time** | < 15 seconds | Cursor CLI resolution |
| **False Positive Rate** | < 5% | Incorrect file matches |
| **Confidence Accuracy** | ≥ 85% | Confidence matches outcome |

### Qualitative Metrics

| Metric | Evaluation Criteria |
|--------|-------------------|
| **User Trust** | Does the confidence score match user perception? |
| **Code Snippet Quality** | Is the highlighted code the right place? |
| **Selector Stability** | Do selectors remain valid after minor changes? |
| **Error Messages** | Are failures clear and actionable? |
| **Developer Experience** | Is the test dashboard useful and intuitive? |

---

## Progress Status

### ✅ Phase 1: Test Case Registry - COMPLETE
- All 55 test cases defined and documented
- TypeScript interface and helper functions implemented
- Ready for Phase 2 (Test Component Library)

### 🔄 Next Phase: Phase 2 - Test Component Library
- Create React components for each test category
- Implement TestCaseViewer wrapper component
- Setup routing for test cases page

## Next Steps

1. ✅ **Phase 1 Complete** - Test case registry implemented
2. **Begin Phase 2** - Start test component library implementation
3. **Iterate on Test Cases** - Refine based on early findings
4. **Execute Full Test Suite** - Gather comprehensive data
5. **Analyze & Prioritize** - Create improvement roadmap

---

## Appendix

### Related Documents

- `DEV_UI_AGENT_PROGRESS.md` - Project progress tracking
- `advanced-element-resolution-design.md` - Advanced resolution strategies

### File Structure

```
src/dev-tools-agent/test-cases/
├── index.tsx                           # Main export
├── TestCaseRegistry.ts                 # All test case definitions
├── TestDashboard.tsx                   # Interactive dashboard
├── components/
│   ├── TestIdVariations.tsx
│   ├── CssSelectorScenarios.tsx
│   ├── DynamicContent.tsx
│   ├── EdgeCases.tsx
│   ├── ComponentPatterns.tsx
│   ├── TestCaseViewer.tsx
│   └── MetricsPanel.tsx
├── utils/
│   ├── runTestCase.ts                 # Test execution logic (accepts useAgentFallback param, defaults to false)
│   ├── exportResults.ts               # Export functionality
│   └── metrics.ts                     # Metrics calculation
└── __tests__/
    ├── resolution.test.ts             # Automated tests
    └── e2e/
        └── test-dashboard.spec.ts     # E2E tests
```

### Technology Stack

- **React** - Test component rendering
- **TypeScript** - Type-safe test definitions
- **Jest** - Unit/integration tests
- **Playwright** - E2E tests
- **Recharts** - Metrics visualization
- **TailwindCSS** - Dashboard styling

---

**Document Status:** Phase 1 Complete - Phase 2 In Progress  
**Last Updated:** 2025-12-13  
**Next Review Date:** After Phase 2 completion  
**Owner:** UI-Agent Development Team

---

## Change Log

### Version 1.1 (2025-12-13)
- ✅ Phase 1: Test Case Registry completed
- Added 55 test cases across 5 categories
- Implemented helper functions and statistics
- Updated status and progress tracking

