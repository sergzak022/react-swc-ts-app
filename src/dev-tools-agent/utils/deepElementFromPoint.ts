/**
 * Recursively traverses open shadow DOMs to find the deepest element at a point.
 * 
 * @param x - The x coordinate
 * @param y - The y coordinate
 * @returns The deepest element found, or null if none
 */
export function deepElementFromPoint(x: number, y: number): Element | null {
  let element = document.elementFromPoint(x, y);
  
  if (!element) {
    return null;
  }
  
  // Keep diving into shadow roots until we can't go deeper
  while (element.shadowRoot) {
    const shadowElement = element.shadowRoot.elementFromPoint(x, y);
    
    // If we can't find an element in the shadow root, or it's the same element,
    // we've reached the deepest point
    if (!shadowElement || shadowElement === element) {
      break;
    }
    
    element = shadowElement;
  }
  
  return element;
}

