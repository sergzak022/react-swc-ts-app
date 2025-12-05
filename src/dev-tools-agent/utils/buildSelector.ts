/**
 * Builds a CSS selector for an element, ensuring uniqueness.
 * Prioritizes data-testid, then id, then builds path-based selectors.
 */

/**
 * Checks if a selector matches exactly one element in the document.
 */
function isUnique(selector: string, root: ParentNode = document): boolean {
  try {
    const matches = root.querySelectorAll(selector);
    return matches.length === 1;
  } catch {
    // Invalid selector
    return false;
  }
}

/**
 * Gets a simple selector for an element (tag + classes or id).
 */
function getSimpleSelector(element: Element): string {
  const tag = element.tagName.toLowerCase();

  // Prefer id if present
  const id = element.getAttribute('id');
  if (id) {
    return `${tag}#${CSS.escape(id)}`;
  }

  // Use classes (limit to first 3 to avoid huge selectors)
  const classes = Array.from(element.classList)
    .filter(cls => cls.trim() !== '')
    .slice(0, 3)
    .map(cls => `.${CSS.escape(cls)}`)
    .join('');

  return classes ? `${tag}${classes}` : tag;
}

/**
 * Adds nth-of-type refinement to a selector if needed.
 */
function addNthOfTypeSelector(element: Element, baseSelector: string): string {
  const parent = element.parentElement;
  if (!parent) return baseSelector;

  const tag = element.tagName.toLowerCase();
  const siblings = Array.from(parent.children).filter(
    child => child.tagName.toLowerCase() === tag
  );

  // Only add nth-of-type if there are multiple siblings of the same tag
  if (siblings.length <= 1) return baseSelector;

  const index = siblings.indexOf(element) + 1;
  return `${baseSelector}:nth-of-type(${index})`;
}

/**
 * Finds the nearest ancestor with data-testid, or the element itself.
 */
function findTestIdAncestor(element: Element): { element: Element; testId: string } | null {
  let current: Element | null = element;

  while (current) {
    const testId = current.getAttribute('data-testid');
    if (testId) {
      return { element: current, testId };
    }
    current = current.parentElement;
  }

  return null;
}

/**
 * Builds a path-based selector by walking up the DOM tree.
 * Tries progressively longer paths until finding a unique one.
 */
function buildPathSelector(element: Element, maxDepth = 4): string {
  const segments: string[] = [];
  let current: Element | null = element;
  let depth = 0;

  // Build segments from element up to maxDepth ancestors
  while (current && depth < maxDepth) {
    segments.unshift(getSimpleSelector(current));
    current = current.parentElement;
    depth++;
  }

  // Try progressively longer paths: leaf, parent>leaf, grandparent>parent>leaf, etc.
  // Start from the most specific (longest path) and work backwards
  for (let i = 0; i < segments.length; i++) {
    const candidate = segments.slice(i).join(' > ');
    if (isUnique(candidate)) {
      return candidate;
    }
  }

  // If nothing is unique, try with nth-of-type on the leaf
  if (segments.length > 0) {
    const refined = addNthOfTypeSelector(element, segments.join(' > '));
    if (isUnique(refined)) {
      return refined;
    }
  }

  // Fallback: return the full path (even if not unique)
  return segments.length > 0 ? segments.join(' > ') : element.tagName.toLowerCase();
}

/**
 * Builds a CSS selector for an element, ensuring uniqueness.
 * Prioritizes data-testid, then id, then builds path-based selectors.
 * 
 * @param element - The DOM element to build a selector for
 * @returns A CSS selector string that uniquely identifies the element
 */
export function buildSelector(element: Element): string {
  // 1. Try data-testid path (most stable)
  const testIdAncestor = findTestIdAncestor(element);
  if (testIdAncestor) {
    const { element: ancestor, testId } = testIdAncestor;
    const base = `[data-testid="${CSS.escape(testId)}"]`;

    // If the ancestor with testId is the target element itself
    if (ancestor === element) {
      if (isUnique(base)) {
        return base;
      }
      // If not unique, try with nth-of-type
      const refined = addNthOfTypeSelector(element, base);
      if (isUnique(refined)) {
        return refined;
      }
    } else {
      // Ancestor has testId, but target is a descendant
      // Try: [data-testid="X"] childSelector
      const childSeg = getSimpleSelector(element);
      let refined = `${base} ${childSeg}`;
      if (isUnique(refined)) {
        return refined;
      }

      // Try with nth-of-type on the child
      refined = addNthOfTypeSelector(element, `${base} > ${childSeg}`);
      if (isUnique(refined)) {
        return refined;
      }
    }
  }

  // 2. Try id (very stable if unique)
  const id = element.getAttribute('id');
  if (id) {
    const idSelector = `#${CSS.escape(id)}`;
    if (isUnique(idSelector)) {
      return idSelector;
    }
    // If id is not unique (shouldn't happen, but handle it), fall through to path
  }

  // 3. Build path-based selector
  return buildPathSelector(element);
}
