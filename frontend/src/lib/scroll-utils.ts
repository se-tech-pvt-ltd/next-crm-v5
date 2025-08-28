/**
 * Utilities for handling scroll events in components
 */

import * as React from 'react';

/**
 * Enable wheel scrolling for an element by preventing event bubbling
 * when the element can scroll in the wheel direction
 */
export function enableWheelScrolling(element: HTMLElement): () => void {
  let lastScrollCheck = 0;
  let cachedScrollInfo: { scrollTop: number; scrollHeight: number; clientHeight: number } | null = null;

  const handleWheel = (e: WheelEvent) => {
    const now = performance.now();

    // Cache scroll info for 16ms (one frame) to avoid excessive layout reads
    if (!cachedScrollInfo || now - lastScrollCheck > 16) {
      const { scrollTop, scrollHeight, clientHeight } = element;
      cachedScrollInfo = { scrollTop, scrollHeight, clientHeight };
      lastScrollCheck = now;
    }

    const { scrollTop, scrollHeight, clientHeight } = cachedScrollInfo;
    const { deltaY } = e;

    // Check if we can scroll in the direction of the wheel
    const canScrollUp = scrollTop > 0;
    const canScrollDown = scrollTop < scrollHeight - clientHeight;
    const isScrollingUp = deltaY < 0;
    const isScrollingDown = deltaY > 0;

    // If we can scroll in the direction the user is wheeling,
    // prevent the event from bubbling to parent elements
    if ((isScrollingUp && canScrollUp) || (isScrollingDown && canScrollDown)) {
      e.stopPropagation();
    }
  };

  element.addEventListener('wheel', handleWheel, { passive: true });

  return () => {
    element.removeEventListener('wheel', handleWheel);
    cachedScrollInfo = null;
  };
}

/**
 * React hook to enable wheel scrolling on a ref element
 */
export function useWheelScrolling<T extends HTMLElement>(
  ref: React.RefObject<T>,
  enabled: boolean = true
) {
  React.useEffect(() => {
    if (!enabled || !ref.current) return;
    
    return enableWheelScrolling(ref.current);
  }, [ref, enabled]);
}

/**
 * Ensure an element and its scrollable children can handle wheel events
 */
export function enableScrollableChildrenWheelEvents(container: HTMLElement): () => void {
  const scrollableSelectors = [
    '[style*="overflow-y: auto"]',
    '[style*="overflow-y:auto"]', 
    '.overflow-y-auto',
    '[style*="overflow: auto"]',
    '[style*="overflow:auto"]',
    '.overflow-auto'
  ];

  const scrollableElements = container.querySelectorAll<HTMLElement>(
    scrollableSelectors.join(', ')
  );

  const cleanupFunctions = Array.from(scrollableElements).map(enableWheelScrolling);

  return () => {
    cleanupFunctions.forEach(cleanup => cleanup());
  };
}
