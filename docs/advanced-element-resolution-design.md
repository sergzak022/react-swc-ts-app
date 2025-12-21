# Advanced Element Resolution Design

## Overview

This document describes the design for enhanced element matching and resolution in UI-Agent. The system collects a clicked element and its ancestor chain, then uses multiple matching strategies on the backend to find the source code location with confidence scoring.

---

## Table of Contents

1. [Goals and Non-Goals](#goals-and-non-goals)
2. [Schema Design](#schema-design)
3. [Frontend Implementation](#frontend-implementation)
4. [Backend Implementation](#backend-implementation)
5. [Certainty Algorithm](#certainty-algorithm)
6. [UI Design](#ui-design)
7. [Implementation Plan](#implementation-plan)
8. [Testing Scenarios](#testing-scenarios)

---

## Goals and Non-Goals

### Goals

- Collect clicked element and ancestor chain with all attributes
- Support matching via parent elements when clicked element has no `data-testid`
- Provide multiple file matches with certainty scores
- Use multiple heuristic strategies for matching (tag, className, textContent, attributes)
- Clear UI showing which element was matched and confidence level

### Non-Goals (MVP)

- Cross-file import tracking (matched parent in one file, clicked element in imported child component)
- AST parsing
- Build-time transforms
- Runtime instrumentation

---

## Schema Design

### Core Types

```typescript
/**
 * Information about a single DOM element.
 * Collected for clicked element and ancestors.
 */
interface ElementInfo {
  /** Tag name (e.g., 'div', 'button', 'span') */
  tagName: string;
  
  /** All attributes as key-value pairs (includes data-testid, class, id, aria-*, etc.) */
  attributes: Record<string, string>;
  
  /** CSS selector for this specific element */
  selector: string;
  
  /** Outer HTML (first 500 chars) */
  domOuterHtml: string;
}

/**
 * Payload sent from frontend to backend.
 */
interface SelectionPayload {
  /** Current page URL */
  pageUrl: string;
  
  /** The element that was clicked */
  clickedElement: ElementInfo;
  
  /** 
   * Ancestor chain starting from clicked element.
   * Collection stops at first element WITHOUT data-testid.
   * Index 0 = clickedElement, 1 = parent, 2 = grandparent, etc.
   */
  ancestors: ElementInfo[];
  
  /** Text content of clicked element only (first 100 chars) */
  textSnippet: string;
}

/**
 * A single line match within a source file.
 */
interface LineMatch {
  /** Line number in the file (1-indexed) */
  lineNumber: number;
  
  /** Which element in ancestors[] array this line matches */
  ancestorIndex: number;
  
  /** How was this match found? */
  matchType: 
    | 'testId-literal'      // data-testid="value"
    | 'testId-constant'     // data-testid={CONSTANT}
    | 'tag'                 // <button
    | 'className'           // className="btn"
    | 'textContent'         // Text content match
    | 'id'                  // id="submit"
    | 'aria-label'          // aria-label="Submit"
    | 'attribute';          // Other data-* or custom attribute
  
  /** The matched value (e.g., testId value, tag name, class name) */
  matchedValue: string;
  
  /** The source line content (trimmed) */
  lineContent: string;
}

/**
 * A source file containing one or more matches.
 */
interface FileMatchResult {
  /** Relative file path from project root */
  filePath: string;
  
  /** All line matches in this file, sorted by ancestorIndex (lowest first) */
  matches: LineMatch[];
  
  /** Certainty score (0-100, higher = more certain) */
  certainty: number;
  
  /** Code snippet around the primary match (lowest ancestorIndex) */
  codeSnippet?: CodeSnippet;
}

/**
 * Backend response containing all matched files.
 */
interface ComponentContext {
  /** Unique ID for this resolution */
  id: string;
  
  /** 
   * Matched files, sorted by certainty score (highest first).
   * Empty array = no matches found.
   * Length 1 = single match.
   * Length > 1 = multiple files matched (ambiguous).
   */
  fileMatches: FileMatchResult[];
}
```

### Existing Types (Keep Unchanged)

```typescript
interface CodeLine {
  lineNumber: number;
  content: string;
  isMatch: boolean;
}

interface CodeSnippet {
  lines: CodeLine[];
  startLine: number;
  endLine: number;
  matchLine: number;
}
```

---

## Frontend Implementation

### File: `src/dev-tools-agent/components/PickerLayer.tsx`

#### Changes Summary

1. Remove `findTestIdInfo()` function (no longer needed)
2. Add `getAllAttributes()` helper
3. Add `collectAncestorChain()` helper
4. Update `buildPayload()` to use new structure

#### Implementation

```typescript
/**
 * Collect all attributes from an element as key-value pairs.
 */
function getAllAttributes(element: Element): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attrs[attr.name] = attr.value;
  }
  return attrs;
}

/**
 * Collect ancestor chain starting from clicked element.
 * Stops at first element WITHOUT data-testid (no point going further).
 */
function collectAncestorChain(element: Element): ElementInfo[] {
  const chain: ElementInfo[] = [];
  let current: Element | null = element;
  
  while (current && current !== document.body && current !== document.documentElement) {
    const attrs = getAllAttributes(current);
    const hasTestId = !!attrs['data-testid'];
    
    chain.push({
      tagName: current.tagName.toLowerCase(),
      attributes: attrs,
      selector: buildSelector(current),
      domOuterHtml: current.outerHTML.slice(0, 500),
    });
    
    // Stop after collecting first element WITHOUT testId
    // (clicked element is always collected, even if it has no testId)
    if (!hasTestId && chain.length > 1) {
      break;
    }
    
    current = current.parentElement;
  }
  
  return chain;
}

/**
 * Build a SelectionPayload from a clicked element.
 */
const buildPayload = useCallback((element: Element): SelectionPayload => {
  const ancestors = collectAncestorChain(element);
  const clickedElement = ancestors[0];
  
  return {
    pageUrl: window.location.href,
    clickedElement,
    ancestors,
    textSnippet: (element.textContent || '').trim().slice(0, 100),
  };
}, []);
```

---

## Backend Implementation

### File: `server/resolvers/testIdResolver.ts`

#### Changes Summary

1. Update function to iterate through `ancestors` array
2. Search for each element's `data-testid` in codebase
3. On match, attempt to find clicked element within matched file
4. Calculate certainty score
5. Return all matches sorted by certainty

#### Core Resolution Logic

```typescript
export const testIdResolver: ResolverFn = async (payload, options) => {
  const allFileMatches: Map<string, LineMatch[]> = new Map();
  
  // Iterate through ancestors to find testId matches
  for (let ancestorIndex = 0; ancestorIndex < payload.ancestors.length; ancestorIndex++) {
    const element = payload.ancestors[ancestorIndex];
    const testId = element.attributes['data-testid'];
    
    if (!testId) continue; // No testId on this element, try next
    
    // Search for this testId in codebase
    const matches = await searchDataTestId(testId, options.cwd);
    
    for (const match of matches) {
      // Add this match to the file's matches
      if (!allFileMatches.has(match.filePath)) {
        allFileMatches.set(match.filePath, []);
      }
      
      allFileMatches.get(match.filePath)!.push({
        lineNumber: match.lineNumber,
        ancestorIndex,
        matchType: match.isConstant ? 'testId-constant' : 'testId-literal',
        matchedValue: testId,
        lineContent: match.lineContent,
      });
    }
  }
  
  // If no testId matches found, return empty
  if (allFileMatches.size === 0) {
    return { fileMatches: [] };
  }
  
  // Build FileMatchResult for each file
  const fileResults: FileMatchResult[] = [];
  
  for (const [filePath, matches] of allFileMatches) {
    // Sort matches by ancestorIndex (lowest first = closest to clicked element)
    matches.sort((a, b) => a.ancestorIndex - b.ancestorIndex);
    
    const primaryMatch = matches[0];
    
    // Try to find clicked element within this file (if match is not on clicked element)
    if (primaryMatch.ancestorIndex > 0) {
      const clickedMatches = await findClickedElementInFile(
        payload.clickedElement,
        filePath,
        primaryMatch.lineNumber,
        options.cwd
      );
      
      if (clickedMatches) {
        matches.unshift(...clickedMatches);
      }
    }
    
    // Calculate certainty
    const certainty = calculateCertainty(matches);
    
    // Extract code snippet around primary match
    const codeSnippet = await extractCodeSnippet(
      filePath,
      primaryMatch.lineNumber,
      options.cwd
    );
    
    fileResults.push({
      filePath,
      matches,
      certainty,
      codeSnippet,
    });
  }
  
  // Sort by certainty (highest first)
  fileResults.sort((a, b) => b.certainty - a.certainty);
  
  return { fileMatches: fileResults };
};
```

#### Clicked Element Matching Strategies

```typescript
interface MatchStrategy {
  name: string;
  weight: number; // Contribution to confidence scoring
  match: (line: string, element: ElementInfo) => boolean;
}

const matchStrategies: MatchStrategy[] = [
  {
    name: 'tagName',
    weight: 10,
    match: (line, el) => {
      const lower = `<${el.tagName}`;
      const upper = `<${el.tagName.charAt(0).toUpperCase() + el.tagName.slice(1)}`;
      return line.includes(lower) || line.includes(upper);
    },
  },
  {
    name: 'className',
    weight: 20,
    match: (line, el) => {
      const cls = el.attributes.class;
      if (!cls) return false;
      // Check if any class name appears in the line
      return cls.split(/\s+/).some(c => c && line.includes(c));
    },
  },
  {
    name: 'textContent',
    weight: 30,
    match: (line, el) => {
      // Use textSnippet from payload (only for clicked element)
      const text = el.textSnippet?.trim();
      if (!text || text.length < 3) return false;
      return line.includes(text);
    },
  },
  {
    name: 'id',
    weight: 25,
    match: (line, el) => {
      const id = el.attributes.id;
      if (!id) return false;
      return line.includes(`id="${id}"`) || 
             line.includes(`id='${id}'`) || 
             line.includes(`id={`);
    },
  },
  {
    name: 'aria-label',
    weight: 20,
    match: (line, el) => {
      const label = el.attributes['aria-label'];
      if (!label) return false;
      return line.includes(label);
    },
  },
  {
    name: 'data-attributes',
    weight: 15,
    match: (line, el) => {
      const dataAttrs = Object.entries(el.attributes)
        .filter(([k]) => k.startsWith('data-') && k !== 'data-testid');
      return dataAttrs.some(([k, v]) => 
        line.includes(`${k}=`) && line.includes(v)
      );
    },
  },
];

/**
 * Find clicked element within a matched file using heuristic strategies.
 */
async function findClickedElementInFile(
  element: ElementInfo,
  filePath: string,
  matchedLineNumber: number,
  cwd: string,
  searchRadius = 30
): Promise<LineMatch[] | null> {
  try {
    const content = await readFile(join(cwd, filePath), 'utf-8');
    const lines = content.split('\n');
    
    const startIdx = Math.max(0, matchedLineNumber - searchRadius - 1);
    const endIdx = Math.min(lines.length, matchedLineNumber + searchRadius);
    
    let bestMatch: { lineNumber: number; strategies: string[]; score: number } | null = null;
    
    for (let i = startIdx; i < endIdx; i++) {
      const line = lines[i];
      const matchedStrategies: string[] = [];
      let score = 0;
      
      for (const strategy of matchStrategies) {
        if (strategy.match(line, element)) {
          matchedStrategies.push(strategy.name);
          score += strategy.weight;
        }
      }
      
      // Require at least 2 strategies to match (reduces false positives)
      if (matchedStrategies.length >= 2) {
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { lineNumber: i + 1, strategies: matchedStrategies, score };
        }
      }
    }
    
    if (!bestMatch) return null;
    
    // Return as LineMatch array
    return [{
      lineNumber: bestMatch.lineNumber,
      ancestorIndex: 0, // Clicked element
      matchType: 'tag', // Simplified - could be more specific
      matchedValue: element.tagName,
      lineContent: lines[bestMatch.lineNumber - 1].trim(),
    }];
    
  } catch {
    return null;
  }
}
```

---

## Certainty Algorithm

Simple, transparent scoring algorithm:

```typescript
function calculateCertainty(matches: LineMatch[]): number {
  let score = 100;
  
  // 1. Penalty for depth: how far from clicked element?
  const lowestAncestorIndex = Math.min(...matches.map(m => m.ancestorIndex));
  score -= lowestAncestorIndex * 15; 
  // 0 = no penalty
  // 1 = -15 (parent)
  // 2 = -30 (grandparent)
  // etc.
  
  // 2. Penalty for multiple testId matches in same file (ambiguity within file)
  const testIdMatches = matches.filter(m => m.matchType.startsWith('testId'));
  if (testIdMatches.length > 1) {
    score -= 20;
  }
  
  // 3. Bonus for matching clicked element directly (ancestorIndex=0)
  const hasClickedMatch = matches.some(m => m.ancestorIndex === 0);
  if (hasClickedMatch) {
    score += 10;
  }
  
  // 4. Bonus for testId match (vs heuristic only)
  const hasTestIdMatch = testIdMatches.length > 0;
  if (hasTestIdMatch) {
    score += 10;
  }
  
  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, score));
}
```

### Scoring Examples

| Scenario | Calculation | Final Score |
|----------|-------------|-------------|
| Clicked element has testId, single match | 100 - 0 + 10 + 10 = 120 → **100** |
| Parent has testId, single match | 100 - 15 + 10 = **95** |
| Grandparent has testId, single match | 100 - 30 + 10 = **80** |
| Parent testId + 2 matches in file | 100 - 15 - 20 + 10 = **75** |
| Clicked element (heuristic only) | 100 - 0 + 10 = **110** → **100** |
| Great-grandparent | 100 - 45 + 10 = **65** |

---

## UI Design

### Scenario 1: Single File Match (Most Common)

```
┌─────────────────────────────────────────┐
│ 🎯 UI-Agent                    ✕       │
├─────────────────────────────────────────┤
│                                         │
│ ✓ Match Found (95% certainty)          │
│                                         │
│ Matched via: Parent element             │
│ testId: "edit-button"                   │
│                                         │
│ 📁 src/components/EditButton.tsx       │
│    Line 15                              │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 13  export function EditButton() { │ │
│ │ 14    return (                      │ │
│ │ 15  ▶ <button data-testid="edit... │ │ ← Highlighted
│ │ 16      <span className="icon">✏️  │ │
│ │ 17      </span>                      │ │
│ │ 18    </button>                      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Selection Payload ▼]                   │
└─────────────────────────────────────────┘
```

### Scenario 2: Multiple File Matches (Ambiguous)

```
┌─────────────────────────────────────────┐
│ 🎯 UI-Agent                    ✕       │
├─────────────────────────────────────────┤
│                                         │
│ ⚠️ Multiple Matches Found               │
│                                         │
│ ┌─ File 1 (95% certainty) ───────────┐ │
│ │ ▼ src/components/EditButton.tsx    │ │
│ │    Line 15                          │ │
│ │    Matched: Parent (testId)         │ │
│ │    [Code snippet visible]           │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ File 2 (80% certainty) ───────────┐ │
│ │ ▶ src/components/Button.tsx        │ │ ← Collapsed
│ │    Line 42                          │ │
│ │    Matched: Grandparent (testId)    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Selection Payload ▼]                   │
└─────────────────────────────────────────┘
```

### Scenario 3: No Matches Found

```
┌─────────────────────────────────────────┐
│ 🎯 UI-Agent                    ✕       │
├─────────────────────────────────────────┤
│                                         │
│ ✗ No Matches Found                     │
│                                         │
│ Found 1 element with data-testid,       │
│ but none matched in codebase:           │
│                                         │
│ • "edit-button" on <button>             │
│                                         │
│ [Selection Payload ▼]                   │
└─────────────────────────────────────────┘
```

### UI Component Structure

```typescript
// Panel.tsx - Main render logic

{componentContext && (
  <>
    {componentContext.fileMatches.length === 0 ? (
      <NoMatchView payload={payload} />
    ) : componentContext.fileMatches.length === 1 ? (
      <SingleMatchView 
        match={componentContext.fileMatches[0]} 
        payload={payload} 
      />
    ) : (
      <MultipleMatchesView 
        matches={componentContext.fileMatches} 
        payload={payload} 
      />
    )}
    
    {/* Selection Payload - always collapsed */}
    <details className="group mt-3">
      <summary className="text-xs text-gray-400 cursor-pointer">
        Selection Payload
      </summary>
      <pre className="text-xs mt-2">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </details>
  </>
)}
```

#### SingleMatchView Component

```typescript
function SingleMatchView({ 
  match, 
  payload 
}: { 
  match: FileMatchResult; 
  payload: SelectionPayload;
}) {
  const primaryMatch = match.matches[0]; // Lowest ancestorIndex
  const matchedElement = payload.ancestors[primaryMatch.ancestorIndex];
  const isDirectMatch = primaryMatch.ancestorIndex === 0;
  
  return (
    <div className="mb-3">
      {/* Status Badge */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-green-400">✓ Match Found</span>
        <span className="text-xs text-gray-400">
          ({match.certainty}% certainty)
        </span>
      </div>
      
      {/* Match Info */}
      <div className="text-sm space-y-1 mb-3">
        <div>
          <span className="text-gray-400">Matched via:</span>{' '}
          <span className={isDirectMatch ? 'text-green-300' : 'text-yellow-300'}>
            {isDirectMatch 
              ? 'Clicked element' 
              : `Parent (${primaryMatch.ancestorIndex} level${primaryMatch.ancestorIndex > 1 ? 's' : ''} up)`
            }
          </span>
        </div>
        
        {primaryMatch.matchType.startsWith('testId') && (
          <div>
            <span className="text-gray-400">testId:</span>{' '}
            <span className="font-mono text-green-300">
              {primaryMatch.matchedValue}
            </span>
          </div>
        )}
        
        <div>
          <span className="text-gray-400">filePath:</span>{' '}
          <span className="font-mono text-blue-300 text-xs break-all">
            {match.filePath}
          </span>
        </div>
        
        <div>
          <span className="text-gray-400">line:</span>{' '}
          <span className="font-mono">{primaryMatch.lineNumber}</span>
        </div>
      </div>
      
      {/* Code Snippet */}
      {match.codeSnippet && (
        <CodeSnippetView snippet={match.codeSnippet} />
      )}
      
      {/* Additional Matches in Same File (if any) */}
      {match.matches.length > 1 && (
        <details className="mt-2">
          <summary className="text-xs text-gray-400 cursor-pointer">
            +{match.matches.length - 1} more match{match.matches.length > 2 ? 'es' : ''} in this file
          </summary>
          <div className="mt-2 space-y-1 text-xs text-gray-400">
            {match.matches.slice(1).map((m, i) => (
              <div key={i}>
                Line {m.lineNumber}: {m.matchType} 
                ({payload.ancestors[m.ancestorIndex].tagName})
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
```

#### MultipleMatchesView Component

```typescript
function MultipleMatchesView({ 
  matches, 
  payload 
}: { 
  matches: FileMatchResult[]; 
  payload: SelectionPayload;
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-yellow-400">⚠️ Multiple Matches Found</span>
        <span className="text-xs text-gray-400">({matches.length} files)</span>
      </div>
      
      <div className="space-y-2">
        {matches.map((match, index) => {
          const primaryMatch = match.matches[0];
          const isExpanded = expandedIndex === index;
          
          return (
            <div 
              key={index} 
              className="border border-gray-600 rounded-md overflow-hidden"
            >
              {/* File Header - Always Visible */}
              <div
                className="p-2 bg-gray-700/50 cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                    <span className="font-mono text-xs text-blue-300">
                      {match.filePath}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({match.certainty}%)
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Line {primaryMatch.lineNumber}
                  </div>
                </div>
              </div>
              
              {/* Expanded Content */}
              {isExpanded && (
                <div className="p-3 bg-gray-800 border-t border-gray-700">
                  <SingleMatchView match={match} payload={payload} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

#### NoMatchView Component

```typescript
function NoMatchView({ payload }: { payload: SelectionPayload | null }) {
  if (!payload) return null;
  
  const elementsWithTestId = payload.ancestors.filter(
    el => el.attributes['data-testid']
  );
  
  return (
    <div className="mb-3 p-3 bg-gray-700 rounded-md">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-red-400">✗ No Matches Found</span>
      </div>
      
      {elementsWithTestId.length > 0 ? (
        <div className="text-sm text-gray-300 space-y-1">
          <div>
            Found {elementsWithTestId.length} element{elementsWithTestId.length > 1 ? 's' : ''} with data-testid,
            but none matched in codebase:
          </div>
          <ul className="list-disc list-inside ml-2 space-y-1 mt-2">
            {elementsWithTestId.map((el, i) => (
              <li key={i} className="text-xs">
                <span className="font-mono">{el.attributes['data-testid']}</span>
                {' '}on <span className="text-gray-400">{el.tagName}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-sm text-gray-300">
          No data-testid found on clicked element or ancestors.
        </div>
      )}
    </div>
  );
}
```

---

## Implementation Plan

### Phase 1: Update Shared Types

**File:** `src/shared/types.ts`

1. Add `ElementInfo` interface
2. Update `SelectionPayload` interface
3. Update `ComponentContext` interface
4. Add `LineMatch` interface
5. Add `FileMatchResult` interface
6. Remove `TestIdInfo` interface (deprecated)

**Validation:** TypeScript compilation succeeds

---

### Phase 2: Update Frontend Payload Builder

**File:** `src/dev-tools-agent/components/PickerLayer.tsx`

1. Remove `findTestIdInfo()` function
2. Add `getAllAttributes()` helper
3. Add `collectAncestorChain()` helper
4. Update `buildPayload()` to use new structure
5. Update import to remove `TestIdInfo`

**Validation:** 
- Click element and check console for new payload structure
- Verify `ancestors` array stops at first element without testId
- Verify all attributes are collected

---

### Phase 3: Update Backend Types

**File:** `server/resolvers/types.ts`

1. Update `ResolutionResult` to return `FileMatchResult` structure
2. Keep `ResolverFn` type but adapt to new return type

**Validation:** TypeScript compilation succeeds

---

### Phase 4: Update Backend Resolver

**File:** `server/resolvers/testIdResolver.ts`

1. Update `testIdResolver` to iterate through `ancestors`
2. Collect all testId matches across files
3. Add `findClickedElementInFile()` function with match strategies
4. Add `calculateCertainty()` function
5. Build and sort `FileMatchResult` array
6. Update return type

**File:** `server/resolvers/index.ts` (if exists)

Update to handle new response structure.

**Validation:**
- Backend returns empty array when no testId found
- Backend returns single file match with correct certainty
- Backend returns multiple files sorted by certainty
- Clicked element matching works within matched file

---

### Phase 5: Update Server Endpoint

**File:** `server/index.ts`

1. Update `/resolve-selection` to work with new `ComponentContext` structure
2. Map `fileMatches` directly to response
3. Remove old `confidence`, `verified` fields

**Validation:** 
- curl test returns new structure
- No TypeScript errors

---

### Phase 6: Update Frontend Panel Display

**File:** `src/dev-tools-agent/components/Panel.tsx`

1. Add `SingleMatchView` component
2. Add `MultipleMatchesView` component
3. Add `NoMatchView` component
4. Update main render logic to use new components
5. Keep existing `CodeSnippetView` component

**Validation:**
- Single match displays correctly with certainty %
- Multiple matches display in collapsible list
- No match displays helpful message
- Code snippet displays with highlight

---

### Phase 7: Testing and Polish

1. Test all scenarios (see Testing Scenarios section)
2. Update `docs/DEV_UI_AGENT_PROGRESS.md` with new Milestone
3. Clean up console logs
4. Update README if needed

---

## Testing Scenarios

### 1. Direct Match (Clicked Element Has TestId)

**DOM:**
```html
<button data-testid="submit-button">Submit</button>
```

**Expected:**
- `ancestors`: 1 element (just the button)
- `fileMatches`: 1 file
- `certainty`: 100
- `matches[0].ancestorIndex`: 0
- UI shows: "✓ Match Found (100% certainty)", "Matched via: Clicked element"

---

### 2. Parent Match

**DOM:**
```html
<button data-testid="edit-button">
  <span class="icon">✏️</span>  <!-- User clicks here -->
</button>
```

**Expected:**
- `ancestors`: 2 elements (span, button)
- `fileMatches`: 1 file
- `certainty`: 95 (100 - 15 + 10)
- `matches[0].ancestorIndex`: 1 (parent)
- UI shows: "Matched via: Parent (1 level up)", testId: "edit-button"

---

### 3. Grandparent Match

**DOM:**
```html
<div data-testid="user-profile">
  <button>
    <span>✏️</span>  <!-- User clicks here -->
  </button>
</div>
```

**Expected:**
- `ancestors`: 3 elements (span, button, div)
- `fileMatches`: 1 file
- `certainty`: 80 (100 - 30 + 10)
- `matches[0].ancestorIndex`: 2 (grandparent)
- UI shows: "Matched via: Parent (2 levels up)"

---

### 4. Multiple File Matches

**DOM:**
```html
<button data-testid="submit">Submit</button>
```

**Codebase has 2 files with "submit" testId:**
- `src/components/SubmitButton.tsx` (older, less specific)
- `src/forms/FormSubmit.tsx` (newer, more specific)

**Expected:**
- `fileMatches`: 2 files
- Both have certainty: 100
- UI shows: "⚠️ Multiple Matches Found (2 files)"
- First file expanded by default
- User can expand/collapse to see both

---

### 5. No TestId in Chain

**DOM:**
```html
<div>
  <span class="text">Hello</span>  <!-- User clicks here -->
</div>
```

**Expected:**
- `ancestors`: 2 elements (span, div) - stops because div has no testId
- `fileMatches`: empty array
- UI shows: "✗ No Matches Found", "No data-testid found on clicked element or ancestors"

---

### 6. TestId Exists But Not in Codebase

**DOM:**
```html
<button data-testid="dynamic-generated-123">Click</button>
```

**Expected:**
- `ancestors`: 1 element (button)
- Backend searches for "dynamic-generated-123", finds nothing
- `fileMatches`: empty array
- UI shows: "✗ No Matches Found", "Found 1 element with data-testid, but none matched in codebase: • 'dynamic-generated-123' on <button>"

---

### 7. Clicked Element Found Within Matched File

**DOM:**
```html
<button data-testid="edit-button">
  <span class="icon edit">✏️</span>  <!-- User clicks here -->
</button>
```

**Code:**
```tsx
// Line 15
<button data-testid="edit-button">
  <span className="icon edit">✏️</span>  // Line 16
</button>
```

**Expected:**
- `ancestors`: 2 elements (span, button)
- Backend matches button on line 15 (testId)
- Backend then searches for span near line 15
- Finds span on line 16 (tag + className + textContent match)
- `matches`: 2 entries (line 16 ancestorIndex=0, line 15 ancestorIndex=1)
- `certainty`: 105 → 100 (capped)
- UI shows primary match as line 16 (clicked element)

---

## Edge Cases and Considerations

### 1. Shadow DOM

Current implementation uses `deepElementFromPoint()` which already handles open shadow DOM. Ancestors will include shadow DOM elements with their attributes collected normally.

### 2. Very Long Ancestor Chains

Collection stops at first element without `data-testid`, keeping payload size manageable.

### 3. Dynamic TestIds

TestIds with variables/interpolation (e.g., `` data-testid={`user-${id}`} ``) will not match literal searches. Future enhancement could use regex patterns.

### 4. Minified/Obfuscated Code

Production builds might have different class names. This tool is meant for development mode only.

### 5. Large Files

`searchFiles` iterates line-by-line. For very large projects, consider caching or using ripgrep/ag instead of fs.readFile.

### 6. Multiple Languages

Currently assumes JSX/TSX. Future: support Vue, Svelte, Angular templates.

---

## Future Enhancements (Out of Scope for MVP)

### Cross-File Import Tracking

When clicked element is in a child component:

```tsx
// EditButton.tsx - Line 15 (testId match)
<button data-testid="edit-button">
  <Icon name="edit" />  // Imported component
</button>

// Icon.tsx - Line 8 (clicked element)
<span className="icon">{iconSvg}</span>
```

**Approach:**
1. Match parent testId in `EditButton.tsx`
2. Parse imports: `import { Icon } from './Icon'`
3. Search `Icon.tsx` for clicked element using heuristics
4. Add to `fileMatches` with lower certainty (penalty for cross-file)

**Schema already supports this** - just add the second file to `fileMatches` array.

### AST-Based Matching

Use babel/typescript parser to:
- Find component boundaries
- Extract prop values precisely
- Handle complex JSX expressions

### Component Name Extraction

Parse file to find component/function name at matched line, add to response.

### Line Number Adjustment for Large Context

Allow user to expand code snippet to see more lines above/below.

---

## Summary

This design provides a robust, scalable solution for matching DOM elements to source code with:

- ✅ Parent chain collection (up to first element without testId)
- ✅ All attributes collected for maximum matching potential
- ✅ Multiple matching strategies (testId, tag, class, text, attributes)
- ✅ Certainty scoring for ranking results
- ✅ Multi-file match support with clear UI
- ✅ Extensible for future enhancements (cross-file, AST, etc.)
- ✅ Clean separation of concerns (frontend collection, backend resolution, UI display)

Implementation can proceed in phases with clear validation at each step.

