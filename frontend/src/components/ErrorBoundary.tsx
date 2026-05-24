import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from 'react';

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(error, errorInfo);
  }

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950">
          <section
            className="mx-auto max-w-2xl rounded-lg border border-red-200 bg-red-50 p-6 text-red-950 shadow-sm"
            role="alert"
          >
            <h1 className="text-2xl font-bold">Something went wrong.</h1>
            <p className="mt-2 text-sm text-red-800">
              Refresh the page and try again. If the problem continues, check the server logs.
            </p>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
