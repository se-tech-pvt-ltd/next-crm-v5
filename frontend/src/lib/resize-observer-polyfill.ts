/**
 * Utility to handle ResizeObserver loop errors gracefully
 *
 * ResizeObserver loop errors are common and usually benign when using libraries
 * like Radix UI, Recharts, and other components that measure DOM elements.
 *
 * This utility helps suppress the console errors while maintaining functionality.
 */

import * as React from 'react';

// Store the original console.error
const originalConsoleError = console.error;

// Track ResizeObserver errors to avoid spam
let resizeObserverErrorCount = 0;
const MAX_RESIZE_OBSERVER_ERRORS = 5;

// Override console.error to filter out ResizeObserver errors
console.error = (...args: any[]) => {
  // Check if the error message contains ResizeObserver loop text
  const errorMessage = args[0]?.toString?.() || '';

  if (errorMessage.includes('ResizeObserver loop completed with undelivered notifications') ||
      errorMessage.includes('ResizeObserver loop limit exceeded') ||
      errorMessage.includes('ResizeObserver loop')) {

    // Only log a few times to avoid spam
    resizeObserverErrorCount++;
    if (resizeObserverErrorCount <= MAX_RESIZE_OBSERVER_ERRORS) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`ResizeObserver: Layout stabilized after iterations (${resizeObserverErrorCount}/${MAX_RESIZE_OBSERVER_ERRORS})`);
      }
    }
    return;
  }

  // For all other errors, use the original console.error
  originalConsoleError.apply(console, args);
};

// Global error handler for ResizeObserver
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('ResizeObserver')) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.toString().includes('ResizeObserver')) {
    event.preventDefault();
    return false;
  }
});

/**
 * Debounced ResizeObserver wrapper to prevent rapid firing
 */
export class DebouncedResizeObserver {
  private observer: ResizeObserver;
  private timeout: NodeJS.Timeout | null = null;
  private callback: ResizeObserverCallback;
  private delay: number;

  constructor(callback: ResizeObserverCallback, delay: number = 100) {
    this.callback = callback;
    this.delay = delay;
    
    this.observer = new ResizeObserver((entries, observer) => {
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
      
      this.timeout = setTimeout(() => {
        this.callback(entries, observer);
        this.timeout = null;
      }, this.delay);
    });
  }

  observe(target: Element, options?: ResizeObserverOptions) {
    this.observer.observe(target, options);
  }

  unobserve(target: Element) {
    this.observer.unobserve(target);
  }

  disconnect() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.observer.disconnect();
  }
}

/**
 * Hook to create a debounced ResizeObserver
 */
export function useDebouncedResizeObserver(
  callback: ResizeObserverCallback,
  delay: number = 100
) {
  const observerRef = React.useRef<DebouncedResizeObserver | null>(null);

  React.useEffect(() => {
    observerRef.current = new DebouncedResizeObserver(callback, delay);
    
    return () => {
      observerRef.current?.disconnect();
    };
  }, [callback, delay]);

  return observerRef.current;
}
