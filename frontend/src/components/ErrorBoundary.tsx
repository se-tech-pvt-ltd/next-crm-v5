import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // Log if desired
    // console.error('ErrorBoundary caught error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div className="p-2 text-sm text-red-600">Something went wrong.</div>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
