import React, { ReactNode, useState } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

const ErrorBoundary = ({ children, fallback }: Props) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Handle synchronous errors during rendering
  if (hasError && error) {
    return fallback || <div className="p-2 text-sm text-red-600">Something went wrong.</div>;
  }

  try {
    return <>{children}</>;
  } catch (err) {
    const typedError = err instanceof Error ? err : new Error(String(err));
    setHasError(true);
    setError(typedError);
    return fallback || <div className="p-2 text-sm text-red-600">Something went wrong.</div>;
  }
};

export default ErrorBoundary;
