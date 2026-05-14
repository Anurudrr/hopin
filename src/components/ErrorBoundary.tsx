import * as React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, State> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-brand-bg px-6">
          <div className="panel-dark max-w-md space-y-6 p-10 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-accent">
              Application Error
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">
              Something Crashed
            </h1>
            <p className="text-sm leading-6 text-white/64">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-full bg-brand-accent px-5 py-3 text-sm font-medium uppercase tracking-[0.22em] text-brand-surface-strong hover:bg-brand-accent-hover"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
