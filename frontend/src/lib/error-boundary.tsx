/**
 * Enhanced error boundary for ResizeObserver and layout errors
 */

import * as React from 'react';

interface ResizeObserverErrorBoundaryState {
  hasError: boolean;
  errorCount: number;
  lastErrorTime: number;
}

interface ResizeObserverErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

const ERROR_RESET_INTERVAL = 5000; // 5 seconds
const MAX_ERRORS_PER_INTERVAL = 3;

export class ResizeObserverErrorBoundary extends React.Component<
  ResizeObserverErrorBoundaryProps,
  ResizeObserverErrorBoundaryState
> {
  private resetTimer: NodeJS.Timeout | null = null;

  constructor(props: ResizeObserverErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorCount: 0, lastErrorTime: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ResizeObserverErrorBoundaryState> | null {
    const errorMessage = error.message || '';
    const now = Date.now();
    
    // Only catch ResizeObserver and layout-related errors
    const isLayoutError = [
      'ResizeObserver',
      'layout',
      'reflow',
      'viewport',
      'dimension'
    ].some(term => errorMessage.toLowerCase().includes(term.toLowerCase()));

    if (isLayoutError) {
      return (prevState) => {
        const timeSinceLastError = now - (prevState?.lastErrorTime || 0);
        const shouldReset = timeSinceLastError > ERROR_RESET_INTERVAL;
        
        return {
          hasError: true,
          errorCount: shouldReset ? 1 : (prevState?.errorCount || 0) + 1,
          lastErrorTime: now
        };
      };
    }

    return null; // Let other errors bubble up
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorMessage = error.message || '';
    const isLayoutError = [
      'ResizeObserver',
      'layout',
      'reflow',
      'viewport',
      'dimension'
    ].some(term => errorMessage.toLowerCase().includes(term.toLowerCase()));

    if (isLayoutError) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[ErrorBoundary] Layout error caught and handled:', error.message);
      }
      
      // Auto-recovery for layout errors
      if (this.state.errorCount < MAX_ERRORS_PER_INTERVAL) {
        this.scheduleReset();
      }
      
      // Call optional error handler
      this.props.onError?.(error, errorInfo);
    } else {
      // Re-throw non-layout errors
      throw error;
    }
  }

  scheduleReset = () => {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }

    this.resetTimer = setTimeout(() => {
      this.setState({ hasError: false, errorCount: 0 });
      this.resetTimer = null;
    }, 100); // Quick recovery for layout issues
  };

  componentWillUnmount() {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
  }

  render() {
    if (this.state.hasError) {
      // Provide custom fallback or invisible recovery
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // For layout errors, render invisibly and auto-recover
      return (
        <div style={{ display: 'contents' }} key={`recovery-${this.state.lastErrorTime}`}>
          {/* Invisible placeholder that forces re-render */}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to suppress ResizeObserver errors in functional components
 */
export function useResizeObserverErrorSuppression() {
  React.useEffect(() => {
    const originalError = console.error;
    
    console.error = (...args: any[]) => {
      const message = args[0]?.toString?.() || '';
      const isResizeObserverError = [
        'ResizeObserver loop completed with undelivered notifications',
        'ResizeObserver loop limit exceeded',
        'ResizeObserver'
      ].some(pattern => message.includes(pattern));
      
      if (isResizeObserverError) {
        // Suppress ResizeObserver errors
        return;
      }
      
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);
}

/**
 * HOC to wrap components with ResizeObserver error boundary
 */
export function withResizeObserverErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <ResizeObserverErrorBoundary fallback={fallback}>
      <Component {...props} ref={ref} />
    </ResizeObserverErrorBoundary>
  ));

  WrappedComponent.displayName = `withResizeObserverErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Layout-safe wrapper for components that might trigger ResizeObserver
 */
export const LayoutSafeWrapper: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <ResizeObserverErrorBoundary>
    <div className={className} style={{ contain: 'layout' }}>
      {children}
    </div>
  </ResizeObserverErrorBoundary>
);
