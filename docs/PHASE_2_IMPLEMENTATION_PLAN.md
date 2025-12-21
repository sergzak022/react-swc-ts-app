# Phase 2: Test Component Library - Implementation Plan

## Document Overview

This document provides a detailed, step-by-step plan for implementing Phase 2 of the UI-Agent testing infrastructure: the Test Component Library.

**Date:** 2025-12-13  
**Version:** 1.0  
**Status:** Ready for Implementation  
**Prerequisites:** Phase 1 (TestCaseRegistry) must be complete

---

## Table of Contents

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Component Specifications](#component-specifications)
4. [Agent Fallback Toggle](#agent-fallback-toggle)
5. [Integration Points](#integration-points)
6. [Implementation Order](#implementation-order)
7. [Testing Checklist](#testing-checklist)
8. [Key Considerations](#key-considerations)

---

## Overview

### Goal

Create React components that render all 55 test cases visually, allowing manual testing with UI-Agent. Each test case is wrapped in a viewer component with metadata and visual indicators.

### What We're Building

- **8 React component files** (6 category components + 1 wrapper + 1 toggle)
- **2 context/utility files** (context provider + main page)
- **1 routing update** (add route to main.tsx)
- **Total: 11 files** (10 new + 1 modified)

### Key Features

- Visual test case display with color-coded confidence levels
- Agent fallback toggle (default: disabled) to control API usage
- Exact matching with TestCaseRegistry values
- Null selector/file handling
- Integration with existing UI-Agent overlay

---

## File Structure

```
src/dev-tools-agent/test-cases/
├── TestCaseRegistry.ts              ✅ (Complete - Phase 1)
├── AgentFallbackContext.tsx         ⏳ (NEW - Context provider)
├── index.tsx                         ⏳ (NEW - Main exports)
├── TestCasesPage.tsx                 ⏳ (NEW - Main page)
└── components/
    ├── AgentFallbackToggle.tsx      ⏳ (NEW - Toggle component)
    ├── TestCaseViewer.tsx            ⏳ (NEW - Wrapper component)
    ├── TestIdVariations.tsx          ⏳ (NEW - 10 testid cases)
    ├── CssSelectorScenarios.tsx      ⏳ (NEW - 15 CSS cases)
    ├── DynamicContent.tsx             ⏳ (NEW - 8 dynamic cases)
    ├── EdgeCases.tsx                 ⏳ (NEW - 12 edge cases)
    └── ComponentPatterns.tsx          ⏳ (NEW - 10 component cases)
```

**Also modify:**
- `src/main.tsx` - Add route

---

## Component Specifications

### 1. AgentFallbackContext.tsx

**Purpose:** Context provider to share agent fallback toggle state across components.

**Location:** `src/dev-tools-agent/test-cases/AgentFallbackContext.tsx`

**Implementation:**

```typescript
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

const STORAGE_KEY = 'ui-agent-use-agent-fallback';

interface AgentFallbackContextType {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const AgentFallbackContext = createContext<AgentFallbackContextType | undefined>(undefined);

/**
 * Provider component that manages agent fallback toggle state.
 * Uses localStorage to persist state across page reloads.
 * Default: disabled (false) to avoid API costs.
 */
export function AgentFallbackProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(() => {
    // Read from localStorage, default to false
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  });
  
  const handleSetEnabled = (value: boolean) => {
    setEnabled(value);
    localStorage.setItem(STORAGE_KEY, String(value));
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new CustomEvent('agentFallbackChange'));
  };
  
  return (
    <AgentFallbackContext.Provider value={{ enabled, setEnabled: handleSetEnabled }}>
      {children}
    </AgentFallbackContext.Provider>
  );
}

/**
 * Hook to access agent fallback state within provider context.
 */
export function useAgentFallback() {
  const context = useContext(AgentFallbackContext);
  if (!context) {
    // Return default (disabled) if context not available
    return { enabled: false, setEnabled: () => {} };
  }
  return context;
}

/**
 * Hook to read agent fallback state from localStorage.
 * Use this in components outside the provider (e.g., UI-Agent overlay).
 */
export function useAgentFallbackFromStorage(): boolean {
  const [enabled, setEnabled] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  });
  
  // Listen for storage changes (if toggle is on another page/tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setEnabled(e.newValue === 'true');
      }
    };
    
    // Also listen for custom event (same-tab updates)
    const handleCustomStorageChange = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      setEnabled(stored === 'true');
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('agentFallbackChange', handleCustomStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('agentFallbackChange', handleCustomStorageChange);
    };
  }, []);
  
  return enabled;
}
```

**Key Features:**
- Uses localStorage for persistence
- Default: `false` (disabled)
- Works across page reloads
- Provides hook for components outside provider

---

### 2. AgentFallbackToggle.tsx

**Purpose:** Toggle component with warning about API costs.

**Location:** `src/dev-tools-agent/test-cases/components/AgentFallbackToggle.tsx`

**Implementation:**

```typescript
import { useAgentFallback } from '../AgentFallbackContext';

export function AgentFallbackToggle() {
  const { enabled, setEnabled } = useAgentFallback();
  
  return (
    <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="w-5 h-5 text-yellow-600 focus:ring-yellow-500"
        />
        <div className="flex-1">
          <div className="font-semibold text-yellow-800">
            Enable Agent Fallback (Cursor CLI)
          </div>
          <div className="text-sm text-yellow-700 mt-1">
            ⚠️ Uses API credits. Only enable for manual testing. 
            Automated tests should keep this disabled.
          </div>
        </div>
      </label>
      {enabled && (
        <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-700 font-semibold">
          ⚠️ Agent fallback is ENABLED - API calls will be made when heuristics fail
        </div>
      )}
    </div>
  );
}
```

**Key Features:**
- Prominent warning about API costs
- Visual indicator when enabled
- Clear default state (disabled)

---

### 3. TestCaseViewer.tsx

**Purpose:** Reusable wrapper component that displays test case metadata and wraps the actual test element.

**Location:** `src/dev-tools-agent/test-cases/components/TestCaseViewer.tsx`

**Props Interface:**

```typescript
import type { TestCase } from '../TestCaseRegistry';

interface TestCaseViewerProps {
  testCase: TestCase;
  children: React.ReactNode; // The actual DOM element to test
}
```

**Implementation:**

```typescript
import type { TestCase } from '../TestCaseRegistry';

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

export function TestCaseViewer({ testCase, children }: TestCaseViewerProps) {
  const borderColor = getBorderColor(testCase.expectedConfidence);
  const badgeColor = getConfidenceBadgeColor(testCase.expectedConfidence);
  
  return (
    <div className={`relative border-2 rounded-lg p-4 m-4 ${borderColor}`}>
      {/* Test Case ID Badge */}
      <div className="absolute top-2 right-2 bg-gray-800 text-white px-2 py-1 rounded text-xs font-mono">
        {testCase.id}
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
      
      {/* Test Element */}
      <div className="test-element mt-4 p-2 bg-white rounded border border-dashed border-gray-300">
        {children}
      </div>
    </div>
  );
}
```

**Key Features:**
- Color-coded borders based on expected confidence
- Test case ID badge
- Metadata display with null handling
- Clear visual separation of test element

---

### 4. TestIdVariations.tsx

**Purpose:** Renders 10 data-testid test cases.

**Location:** `src/dev-tools-agent/test-cases/components/TestIdVariations.tsx`

**Key Requirements:**
- Match exact test case IDs: `testid-01` through `testid-10`
- Use exact expected values from registry
- Define constants/functions that resolvers can find

**Constants/Functions to Define:**

```typescript
// For testid-02: const BUTTON_ID = "action-btn"
const BUTTON_ID = "action-btn";

// For testid-03: TestIds.SUBMIT = "submit-button"
// For testid-04: TestIds.item("user") = "item-user"
const TestIds = {
  SUBMIT: "submit-button",
  item: (name: string) => `item-${name}`
};
```

**Implementation:**

```typescript
import React from 'react';
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
          <button data-testid="user-button">User Button</button>
        </TestCaseViewer>
        
        {/* testid-02: Constant data-testid */}
        <TestCaseViewer testCase={testCases[1]}>
          <button data-testid={BUTTON_ID}>Action Button</button>
        </TestCaseViewer>
        
        {/* testid-03: Namespaced data-testid */}
        <TestCaseViewer testCase={testCases[2]}>
          <button data-testid={TestIds.SUBMIT}>Submit</button>
        </TestCaseViewer>
        
        {/* testid-04: Function-generated testid */}
        <TestCaseViewer testCase={testCases[3]}>
          <div data-testid={TestIds.item("user")}>User Item</div>
        </TestCaseViewer>
        
        {/* testid-05: Nested element with parent testid */}
        <TestCaseViewer testCase={testCases[4]}>
          <div data-testid="card">
            <span>Nested span text</span>
          </div>
        </TestCaseViewer>
        
        {/* testid-06: Distant ancestor testid */}
        <TestCaseViewer testCase={testCases[5]}>
          <div data-testid="container">
            <div>
              <div>
                <div>
                  <div>
                    <span>Deeply nested span</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TestCaseViewer>
        
        {/* testid-07: Duplicate testid values */}
        <TestCaseViewer testCase={testCases[6]}>
          <div>
            <button data-testid="duplicate">First duplicate</button>
            <button data-testid="duplicate">Second duplicate</button>
          </div>
        </TestCaseViewer>
        
        {/* testid-08: Template literal testid */}
        <TestCaseViewer testCase={testCases[7]}>
          <div data-testid={`card-${123}`}>Card with ID 123</div>
        </TestCaseViewer>
        
        {/* testid-09: Prop-passed testid */}
        <TestCaseViewer testCase={testCases[8]}>
          <ComponentWithTestId testId="prop-passed" />
        </TestCaseViewer>
        
        {/* testid-10: Spread testid */}
        <TestCaseViewer testCase={testCases[9]}>
          <ComponentWithSpreadTestId data-testid="spread-props" />
        </TestCaseViewer>
      </div>
    </div>
  );
}
```

---

### 5. CssSelectorScenarios.tsx

**Purpose:** Renders 15 CSS selector test cases.

**Location:** `src/dev-tools-agent/test-cases/components/CssSelectorScenarios.tsx`

**CSS Module File Needed:**

Create `src/dev-tools-agent/test-cases/components/CssSelectorScenarios.module.css`:
```css
.card {
  padding: 1rem;
  background: white;
  border: 1px solid #ccc;
}
```

**Implementation:**

```typescript
import React, { useState } from 'react';
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
```

---

### 6. DynamicContent.tsx

**Purpose:** Renders 8 dynamic content test cases.

**Location:** `src/dev-tools-agent/test-cases/components/DynamicContent.tsx`

**Implementation:**

```typescript
import React, { useState } from 'react';
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
            {items.map((item, index) => (
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
```

---

### 7. EdgeCases.tsx

**Purpose:** Renders 12 edge case test cases.

**Location:** `src/dev-tools-agent/test-cases/components/EdgeCases.tsx`

**Special Handling:**
- `edge-04` and `edge-05`: `expectedSelector: null` - show message
- Portal: Need `#portal-root` div
- Shadow DOM: Create custom element

**Implementation:**

```typescript
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TestCaseViewer } from './TestCaseViewer';
import { getTestCasesByCategory } from '../TestCaseRegistry';

// Custom element with shadow DOM for edge-03
class CustomElementWithShadow extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<div class="content">Shadow DOM Content</div>';
  }
}

// Only define custom element if it doesn't already exist
if (!customElements.get('custom-element')) {
  customElements.define('custom-element', CustomElementWithShadow);
}

// Portal component for edge-06
function PortalModal({ children }: { children: React.ReactNode }) {
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
  
  return (
    <div className="test-category">
      <h2 className="text-2xl font-bold mb-4">Edge Cases (12 cases)</h2>
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
          <custom-element></custom-element>
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
          <math>
            <mrow>
              <mi>x</mi>
              <mo>=</mo>
              <mn>5</mn>
            </mrow>
          </math>
        </TestCaseViewer>
        
        {/* edge-10: Custom web component */}
        <TestCaseViewer testCase={testCases[9]}>
          <my-widget>Custom Widget</my-widget>
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
          <div className="hidden" style={{ display: 'none' }}>
            Hidden Element
          </div>
        </TestCaseViewer>
      </div>
    </div>
  );
}
```

---

### 8. ComponentPatterns.tsx

**Purpose:** Renders 10 component pattern test cases.

**Location:** `src/dev-tools-agent/test-cases/components/ComponentPatterns.tsx`

**Components to Create:**

```typescript
import React, { forwardRef, memo, lazy, Suspense, useRef } from 'react';
import type { ComponentType, ReactNode, ButtonHTMLAttributes } from 'react';
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
const ForwardedInput = forwardRef<HTMLInputElement>((props, ref) => (
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
```

---

### 9. TestCasesPage.tsx

**Purpose:** Main page that imports and renders all test category components.

**Location:** `src/dev-tools-agent/test-cases/TestCasesPage.tsx`

**Implementation:**

```typescript
import { AgentFallbackProvider } from './AgentFallbackContext';
import { AgentFallbackToggle } from './components/AgentFallbackToggle';
import { TestIdVariations } from './components/TestIdVariations';
import { CssSelectorScenarios } from './components/CssSelectorScenarios';
import { DynamicContent } from './components/DynamicContent';
import { EdgeCases } from './components/EdgeCases';
import { ComponentPatterns } from './components/ComponentPatterns';

export function TestCasesPage() {
  return (
    <AgentFallbackProvider>
      <TestCasesPageContent />
    </AgentFallbackProvider>
  );
}

function TestCasesPageContent() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">UI-Agent Test Cases</h1>
        <p className="text-gray-600">
          Click any test element to trigger UI-Agent resolution. 
          Open UI-Agent overlay (🎯 button) first.
        </p>
      </header>
      
      {/* Agent Fallback Toggle */}
      <AgentFallbackToggle />
      
      {/* Navigation */}
      <nav className="mb-6 flex gap-4 flex-wrap">
        <a href="#testid" className="text-blue-600 hover:underline">data-testid</a>
        <a href="#css" className="text-blue-600 hover:underline">CSS Selectors</a>
        <a href="#dynamic" className="text-blue-600 hover:underline">Dynamic Content</a>
        <a href="#edge" className="text-blue-600 hover:underline">Edge Cases</a>
        <a href="#component" className="text-blue-600 hover:underline">Component Patterns</a>
      </nav>
      
      {/* Test Categories */}
      <div className="space-y-12">
        <section id="testid">
          <TestIdVariations />
        </section>
        
        <section id="css">
          <CssSelectorScenarios />
        </section>
        
        <section id="dynamic">
          <DynamicContent />
        </section>
        
        <section id="edge">
          <EdgeCases />
        </section>
        
        <section id="component">
          <ComponentPatterns />
        </section>
      </div>
    </div>
  );
}
```

---

### 10. index.tsx

**Purpose:** Main export file for the test-cases module.

**Location:** `src/dev-tools-agent/test-cases/index.tsx`

**Implementation:**

```typescript
export { TestCasesPage } from './TestCasesPage';
export { 
  TEST_CASES, 
  TestCase, 
  getTestCasesByCategory, 
  getTestCaseById,
  getTestCasesByTag,
  getTestCasesByPriority,
  getTestCaseStats
} from './TestCaseRegistry';
export { AgentFallbackProvider, useAgentFallback, useAgentFallbackFromStorage } from './AgentFallbackContext';
export { TestCaseViewer } from './components/TestCaseViewer';
export { AgentFallbackToggle } from './components/AgentFallbackToggle';
export { TestIdVariations } from './components/TestIdVariations';
export { CssSelectorScenarios } from './components/CssSelectorScenarios';
export { DynamicContent } from './components/DynamicContent';
export { EdgeCases } from './components/EdgeCases';
export { ComponentPatterns } from './components/ComponentPatterns';
```

---

## Agent Fallback Toggle

### Integration with UI-Agent Overlay

**File:** `src/dev-tools-agent/UiAgentOverlay.tsx` (or wherever resolution API is called)

**Update the API call:**

**File:** `src/dev-tools-agent/UiAgentOverlay.tsx`

```typescript
import { useAgentFallbackFromStorage } from './test-cases/AgentFallbackContext';
import { resolveSelection } from './api';

export function UiAgentOverlay() {
  // ... existing state ...
  
  // Call hook at component level (not inside callbacks)
  const useAgentFallback = useAgentFallbackFromStorage();
  
  // ... existing handlers ...
  
  const handleSelect = useCallback((selectedPayload: SelectionPayload) => {
    setPayload(selectedPayload);
    setComponentContext(null);
    console.log('[UI-Agent] Element selected:', selectedPayload);

    // Use the hook value here - pass as third parameter
    resolveSelection(selectedPayload, BACKEND_URL, useAgentFallback)
      .then((ctx) => {
        setComponentContext(ctx);
        console.log('[UI-Agent] Component context resolved:', ctx);
      })
      .catch((err) => {
        console.error('[UI-Agent] Failed to resolve selection:', err);
      });
  }, [useAgentFallback]); // Add useAgentFallback to dependencies
  
  // ... rest of component ...
}
```

**Note:** 
- The hook must be called at the component level, not inside callbacks
- Add `useAgentFallback` to the `useCallback` dependency array
- The existing `api.ts` already accepts `useAgentFallback` as the third parameter

---

## Integration Points

### Routing Setup

**File:** `src/main.tsx`

**Add Route:**

```typescript
import { TestCasesPage } from './dev-tools-agent/test-cases';

const router = createBrowserRouter([
  // ... existing routes
  {
    path: "/dev-tools-agent/test-cases",
    element: <TestCasesPage />,
  },
]);
```

---

## Implementation Order

### Step 1: Context and Toggle (Foundation)
1. Create `AgentFallbackContext.tsx`
2. Create `AgentFallbackToggle.tsx`
3. Test toggle functionality

### Step 2: Wrapper Component
4. Create `TestCaseViewer.tsx`
5. Test with a simple test case

### Step 3: Category Components (Start Simple)
6. Create `TestIdVariations.tsx` (10 cases - most straightforward)
7. Test with UI-Agent overlay

### Step 4: More Category Components
8. Create `CssSelectorScenarios.tsx` (15 cases - includes CSS Module)
9. Create `DynamicContent.tsx` (8 cases - includes state)
10. Test both

### Step 5: Complex Components
11. Create `EdgeCases.tsx` (12 cases - includes special handling)
12. Create `ComponentPatterns.tsx` (10 cases - includes React patterns)
13. Test both

### Step 6: Page and Routing
14. Create `TestCasesPage.tsx`
15. Create `index.tsx`
16. Add route to `main.tsx`
17. Test full page

### Step 7: Integration
18. Update `UiAgentOverlay.tsx`:
    - Import `useAgentFallbackFromStorage` hook
    - Call hook at component level (not in callback)
    - Pass `useAgentFallback` value to `resolveSelection` as third parameter
    - Add `useAgentFallback` to `handleSelect` callback dependencies
19. Test end-to-end: toggle → click element → verify API call
20. Verify custom event is dispatched when toggle changes
21. Verify UI-Agent overlay reacts to toggle state changes

---

## Testing Checklist

After implementation, verify:

### Visual Testing
- [ ] All 55 test cases render on page
- [ ] Each test case shows correct metadata
- [ ] Color coding matches expected confidence (green/yellow/red)
- [ ] Null selectors display warning message
- [ ] Null files display warning message
- [ ] Test case IDs match registry exactly
- [ ] Navigation links work (scroll to sections)

### Functionality Testing
- [ ] Agent fallback toggle works (default: disabled)
- [ ] Toggle state persists in localStorage
- [ ] Clicking elements triggers UI-Agent overlay
- [ ] Resolution API receives correct `useAgentFallback` value
- [ ] When disabled, no Cursor CLI calls are made
- [ ] When enabled, Cursor CLI is called for low-confidence results

### Integration Testing
- [ ] Routing works: `/dev-tools-agent/test-cases`
- [ ] UI-Agent overlay can read toggle state from localStorage
- [ ] Toggle state changes trigger custom event
- [ ] UI-Agent overlay receives updated state when toggle changes
- [ ] Constants/functions match resolver expectations
- [ ] CSS Module classes work correctly
- [ ] Portal elements render correctly
- [ ] Shadow DOM elements work (open mode)
- [ ] Custom element registration doesn't throw errors on re-import

### Edge Cases
- [ ] Null selector cases display correctly
- [ ] Null file cases display correctly
- [ ] Deeply nested elements are clickable
- [ ] Hidden elements are still selectable
- [ ] SVG elements work correctly

---

## Key Considerations

### 1. Exact Value Matching

**Critical:** All test case values must match the registry exactly:
- Test IDs: `"user-button"`, `"action-btn"`, etc.
- Constants: `BUTTON_ID = "action-btn"` (exact match)
- Functions: `TestIds.item("user")` → `"item-user"` (exact pattern)

**Safety Checks:** Components include verification to warn if test case order changes:
```typescript
if (testCases.length !== 10 || testCases[0]?.id !== 'testid-01') {
  console.warn('[TestIdVariations] Test case order mismatch!');
}
```

### 2. Null Selector Handling

Some test cases have `expectedSelector: null`:
- `edge-04`: Shadow DOM (closed)
- `edge-05`: iFrame content

Display a clear message: "Selector cannot be generated for this case"

### 3. Null File Handling

Many test cases have `expectedFile: null`:
- Indicates heuristics cannot resolve
- Display: "Heuristics cannot resolve this case"
- Agent fallback may help (if enabled)

### 4. Color Coding

Based on `expectedConfidence`:
- `high` → Green border (`border-green-500`)
- `medium` → Yellow border (`border-yellow-500`)
- `low` → Red border (`border-red-500`)

### 5. Agent Fallback Default

**Always default to `false` (disabled)** to avoid API costs:
- Toggle starts disabled
- localStorage defaults to `false`
- Automated tests always use `false`

**Important:** The `AgentFallbackContext` dispatches a custom event when state changes, allowing components outside the provider (like UI-Agent overlay) to react to changes via `useAgentFallbackFromStorage` hook.

### 6. CSS Module Support

For `css-03` test case:
- Create `src/dev-tools-agent/test-cases/components/CssSelectorScenarios.module.css`
- Import and use: `className={styles.card}`
- Vite supports CSS Modules by default (files ending in `.module.css`)

### 7. Portal Support

For `edge-06` test case:
- Create `#portal-root` div dynamically if needed
- Use React `createPortal`
- Clean up on unmount

### 8. Shadow DOM Support

For `edge-03` test case:
- Create custom element with open shadow root
- Use `attachShadow({ mode: 'open' })`
- Register with `customElements.define()`

---

## Dependencies

**No new npm packages needed:**
- React ✅ (already installed)
- TypeScript ✅ (already installed)
- TailwindCSS ✅ (already installed)
- React Router ✅ (already installed)

**Optional:**
- CSS Modules support (for `css-03` test case)
- React Portal support (for `edge-06` test case)

---

## Success Criteria

Phase 2 is complete when:

1. ✅ All 55 test cases render visually on the page
2. ✅ Agent fallback toggle works and persists state
3. ✅ UI-Agent overlay can read toggle state
4. ✅ Clicking test elements triggers resolution
5. ✅ Backend receives correct `useAgentFallback` flag
6. ✅ No backend changes were needed
7. ✅ Routing works correctly
8. ✅ All test case values match registry exactly

---

## Next Steps After Phase 2

Once Phase 2 is complete:

1. **Manual Testing:** Click through all test cases, verify resolutions
2. **Document Findings:** Note which cases work/don't work
3. **Begin Phase 3:** Test Dashboard with metrics and automation
4. **Begin Phase 4:** Automated test suite (always with `useAgentFallback: false`)

---

## Known Issues Fixed

This document has been updated to resolve the following issues:

1. ✅ **Missing React imports** - All component examples now include proper React imports
2. ✅ **Missing useState import** - Added to CssSelectorScenarios.tsx
3. ✅ **Custom element registration** - Added check to prevent duplicate registration errors
4. ✅ **AgentFallbackContext custom event** - Added event dispatch when state changes
5. ✅ **UiAgentOverlay integration** - Complete example showing hook usage at component level
6. ✅ **Portal root cleanup** - Fixed to only clean up nodes created by component
7. ✅ **Test case verification** - Added safety checks to warn if order changes
8. ✅ **Type imports** - All TypeScript type imports are now shown
9. ✅ **CSS Module location** - Clarified exact file path
10. ✅ **DynamicContent state** - Fixed to use independent state for each test case

---

**Document Status:** Ready for Implementation (Issues Resolved)  
**Last Updated:** 2025-12-13  
**Version:** 1.1  
**Owner:** UI-Agent Development Team

