/**
 * Error boundary specifically for handling ResizeObserver errors
 */

import * as React from 'react';

interface ResizeObserverErrorBoundaryState {
  hasError: boolean;
  errorCount: number;
}

interface ResizeObserverErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  maxErrors?: number;
}

export class ResizeObserverErrorBoundary extends React.Component<
  ResizeObserverErrorBoundaryProps,
  ResizeObserverErrorBoundaryState
> {
  private resetTimeout: NodeJS.Timeout | null = null;

  constructor(props: ResizeObserverErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ResizeObserverErrorBoundaryState> | null {
    // Only catch ResizeObserver errors
    if (error.message && error.message.includes('ResizeObserver')) {
      return { hasError: true };
    }
    // Let other errors bubble up
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Only handle ResizeObserver errors
    if (error.message && error.message.includes('ResizeObserver')) {
      console.debug('ResizeObserver error caught by boundary:', error.message);
      
      this.setState(prevState => ({
        errorCount: prevState.errorCount + 1
      }));

      // Auto-reset after a delay
      if (this.resetTimeout) {
        clearTimeout(this.resetTimeout);
      }
      
      this.resetTimeout = setTimeout(() => {
        this.setState({ hasError: false });
      }, 100);
    }
  }

  componentWillUnmount() {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
  }

  render() {
    const { maxErrors = 5 } = this.props;
    
    // If we've had too many errors, show fallback
    if (this.state.hasError && this.state.errorCount > maxErrors) {
      return this.props.fallback || (
        <div className="p-4 text-sm text-muted-foreground">
          Content temporarily unavailable due to layout issues.
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
    
    const suppressedError = (...args: any[]) => {
      const message = args[0]?.toString?.() || '';
      if (message.includes('ResizeObserver')) {
        // Suppress ResizeObserver errors
        return;
      }
      originalError.apply(console, args);
    };

    console.error = suppressedError;

    return () => {
      console.error = originalError;
    };
  }, []);
}
