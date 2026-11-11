import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Log enough for diagnostics without sending user data anywhere.
    console.error('Unhandled app error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-background text-center">
        <div className="max-w-md space-y-5">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="mt-2 text-muted-foreground">The app hit an unexpected error. Try reloading, or go back home.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/home"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Home className="w-4 h-4" /> Home
            </Link>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-secondary px-5 font-semibold text-secondary-foreground hover:bg-secondary/80"
            >
              <RefreshCw className="w-4 h-4" /> Reload
            </button>
          </div>
        </div>
      </main>
    );
  }
}
