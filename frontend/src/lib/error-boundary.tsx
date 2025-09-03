/*
 * Enhanced error boundary for ResizeObserver and layout errors - functional variant
 */
import * as React from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

interface ResizeObserverErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
}

const ERROR_RESET_DELAY = 100;

function isLayoutError(error: unknown): boolean {
  const message = (error as Error)?.message || '';
  return [
    'ResizeObserver',
    'layout',
    'reflow',
    'viewport',
    'dimension',
  ].some((term) => message.toLowerCase().includes(term.toLowerCase()));
}

function DefaultLayoutFallback({ error, resetErrorBoundary }: FallbackProps) {
  React.useEffect(() => {
    if (isLayoutError(error)) {
      const t = setTimeout(() => resetErrorBoundary(), ERROR_RESET_DELAY);
      return () => clearTimeout(t);
    }
  }, [error, resetErrorBoundary]);

  if (!isLayoutError(error)) {
    return null;
  }

  return (
    <div style={{ display: 'contents', contain: 'layout' }}>
      <div style={{ width: 0, height: 0, overflow: 'hidden' }}>Recovery in progress...</div>
    </div>
  );
}

export function ResizeObserverErrorBoundary({ children, fallback, onError }: ResizeObserverErrorBoundaryProps) {
  const FallbackComponent = React.useCallback(
    (props: FallbackProps) => {
      if (fallback) return <>{fallback}</>;
      return <DefaultLayoutFallback {...props} />;
    },
    [fallback]
  );

  return (
    <ErrorBoundary
      FallbackComponent={FallbackComponent}
      onError={(error, errorInfo) => {
        if (process.env.NODE_ENV === 'development' && isLayoutError(error)) {
          console.debug('[ErrorBoundary] Layout error caught and handled:', (error as Error).message);
        }
        onError?.(error as Error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
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
        'ResizeObserver',
      ].some((pattern) => message.includes(pattern));

      if (isResizeObserverError) {
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
      {/* @ts-expect-error ref compatibility for HOC wrapper */}
      <Component {...(props as P)} ref={ref} />
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
