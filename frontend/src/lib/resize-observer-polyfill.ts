/**
 * Utility to handle ResizeObserver loop errors gracefully
 * 
 * ResizeObserver loop errors are common and usually benign when using libraries
 * like Radix UI, Recharts, and other components that measure DOM elements.
 * 
 * This utility helps suppress the console errors while maintaining functionality.
 */

// Store the original console.error
const originalConsoleError = console.error;

// Override console.error to filter out ResizeObserver errors
console.error = (...args: any[]) => {
  // Check if the error message contains ResizeObserver loop text
  const errorMessage = args[0]?.toString?.() || '';
  
  if (errorMessage.includes('ResizeObserver loop completed with undelivered notifications') ||
      errorMessage.includes('ResizeObserver loop limit exceeded')) {
    // Optionally log a simplified message in development
    if (process.env.NODE_ENV === 'development') {
      console.debug('ResizeObserver: Layout stabilized after iterations');
    }
    return;
  }
  
  // For all other errors, use the original console.error
  originalConsoleError.apply(console, args);
};

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
