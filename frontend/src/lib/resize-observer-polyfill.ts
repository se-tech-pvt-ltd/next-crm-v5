/**
 * Enhanced ResizeObserver error suppression and stabilization
 *
 * This utility provides comprehensive handling for ResizeObserver errors that are
 * common when using libraries like Radix UI, Recharts, and responsive components.
 */

import * as React from 'react';

// Use native ResizeObserver reference before patching
const NativeResizeObserver: typeof ResizeObserver | undefined = (typeof window !== 'undefined' ? (window as any).ResizeObserver : undefined);

// Store the original console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Enhanced error tracking
let resizeObserverErrorCount = 0;
const MAX_RESIZE_OBSERVER_ERRORS = 3;
const ERROR_RESET_TIMEOUT = 10000; // Reset counter after 10 seconds

// ResizeObserver error patterns to catch
const RESIZE_OBSERVER_PATTERNS = [
  'ResizeObserver loop completed with undelivered notifications',
  'ResizeObserver loop limit exceeded',
  'ResizeObserver loop',
  'ResizeObserver maximum',
  'non-zero delta',
  'ResizeObserver callback'
];

// Debounce reset function
let resetTimeoutId: NodeJS.Timeout | null = null;

const resetErrorCount = () => {
  if (resetTimeoutId) {
    clearTimeout(resetTimeoutId);
  }
  resetTimeoutId = setTimeout(() => {
    resizeObserverErrorCount = 0;
  }, ERROR_RESET_TIMEOUT);
};

const isResizeObserverError = (message: string): boolean => {
  return RESIZE_OBSERVER_PATTERNS.some(pattern => 
    message.toLowerCase().includes(pattern.toLowerCase())
  );
};

// Enhanced console.error override
console.error = (...args: any[]) => {
  const errorMessage = args[0]?.toString?.() || '';
  
  if (isResizeObserverError(errorMessage)) {
    resizeObserverErrorCount++;
    
    // Only log first few occurrences and reset counter
    if (resizeObserverErrorCount <= MAX_RESIZE_OBSERVER_ERRORS) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[ResizeObserver] Layout stabilization event ${resizeObserverErrorCount}/${MAX_RESIZE_OBSERVER_ERRORS}`);
      }
    }
    
    resetErrorCount();
    return; // Suppress the error
  }

  // For all other errors, use the original console.error
  originalConsoleError.apply(console, args);
};

// Enhanced console.warn override for ResizeObserver warnings
console.warn = (...args: any[]) => {
  const warnMessage = args[0]?.toString?.() || '';
  
  if (isResizeObserverError(warnMessage)) {
    return; // Suppress ResizeObserver warnings
  }

  originalConsoleWarn.apply(console, args);
};

// Global error event handler
const handleGlobalError = (event: ErrorEvent) => {
  if (event.error && isResizeObserverError(event.error.message || '')) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
  
  if (event.message && isResizeObserverError(event.message)) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
};

// Global unhandled rejection handler
const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  const reason = event.reason;
  if (reason && isResizeObserverError(reason.toString())) {
    event.preventDefault();
    return false;
  }
};

// Install global handlers
window.addEventListener('error', handleGlobalError, true);
window.addEventListener('unhandledrejection', handleUnhandledRejection, true);

/**
 * Stabilized ResizeObserver wrapper that prevents loops
 */
export class StabilizedResizeObserver {
  private observer: ResizeObserver;
  private timeout: NodeJS.Timeout | null = null;
  private callback: ResizeObserverCallback;
  private delay: number;
  private isObserving = false;
  private pendingEntries: ResizeObserverEntry[] = [];

  constructor(callback: ResizeObserverCallback, delay: number = 150) {
    this.callback = callback;
    this.delay = delay;
    
    const RO = NativeResizeObserver || ResizeObserver;
    this.observer = new RO((entries, observer) => {
      // Collect entries to batch process them
      this.pendingEntries.push(...entries);
      
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
      
      this.timeout = setTimeout(() => {
        try {
          if (this.pendingEntries.length > 0 && this.isObserving) {
            // Use the most recent entries
            const latestEntries = this.pendingEntries.slice(-5); // Limit to last 5 entries
            this.callback(latestEntries, observer);
            this.pendingEntries = [];
          }
        } catch (error) {
          // Silently handle any errors in the callback
          if (process.env.NODE_ENV === 'development') {
            console.debug('[ResizeObserver] Callback error handled:', error);
          }
        }
        this.timeout = null;
      }, this.delay);
    });
  }

  observe(target: Element, options?: ResizeObserverOptions) {
    try {
      this.isObserving = true;
      this.observer.observe(target, options);
    } catch (error) {
      // Handle potential observer errors silently
      if (process.env.NODE_ENV === 'development') {
        console.debug('[ResizeObserver] Observe error handled:', error);
      }
    }
  }

  unobserve(target: Element) {
    try {
      this.observer.unobserve(target);
    } catch (error) {
      // Handle potential unobserve errors silently
    }
  }

  disconnect() {
    this.isObserving = false;
    this.pendingEntries = [];
    
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    
    try {
      this.observer.disconnect();
    } catch (error) {
      // Handle potential disconnect errors silently
    }
  }
}

/**
 * React hook for stabilized ResizeObserver
 */
export function useStabilizedResizeObserver(
  callback: ResizeObserverCallback,
  delay: number = 150
) {
  const observerRef = React.useRef<StabilizedResizeObserver | null>(null);
  const callbackRef = React.useRef(callback);

  // Keep callback ref current
  React.useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  React.useEffect(() => {
    observerRef.current = new StabilizedResizeObserver(
      (...args) => callbackRef.current(...args),
      delay
    );
    
    return () => {
      observerRef.current?.disconnect();
    };
  }, [delay]);

  return observerRef.current;
}

/**
 * Legacy compatibility - alias for existing code
 */
export const DebouncedResizeObserver = StabilizedResizeObserver;
export const useDebouncedResizeObserver = useStabilizedResizeObserver;

/**
 * Cleanup function for tests or unmounting
 */
export const cleanupResizeObserverHandlers = () => {
  window.removeEventListener('error', handleGlobalError, true);
  window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
  
  // Reset console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  
  // Clear timeouts
  if (resetTimeoutId) {
    clearTimeout(resetTimeoutId);
    resetTimeoutId = null;
  }
};

// Export for emergency debugging
if (process.env.NODE_ENV === 'development') {
  (window as any).__resizeObserverDebug = {
    errorCount: () => resizeObserverErrorCount,
    resetCount: () => { resizeObserverErrorCount = 0; },
    cleanup: cleanupResizeObserverHandlers
  };
}
