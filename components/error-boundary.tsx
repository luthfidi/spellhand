"use client";

import { Component, type ReactNode } from "react";

interface State {
  error: Error | null;
}

/**
 * Last-resort error boundary. Catches render-phase errors anywhere in the tree
 * and shows a small recovery UI instead of a blank screen.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // Hook into a real logger later (Sentry, etc).
    if (process.env.NODE_ENV !== "production") {
      console.error("[ErrorBoundary]", error);
    }
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-svh flex-col items-center justify-center bg-ink px-6 text-center">
          <p className="caption text-blood">FAULT · UNEXPECTED ERROR</p>
          <h1 className="mt-4 font-[family-name:var(--font-display-loaded)] text-5xl italic leading-[0.95] sm:text-7xl">
            Something
            <br />
            broke.
          </h1>
          <p className="mt-6 max-w-md font-mono text-sm text-bone-2">
            The instrument hit an unexpected state. Try reloading the page.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => location.reload()}
              className="inline-flex items-center gap-3 bg-acid px-6 py-3 font-mono text-sm text-ink"
            >
              RELOAD <span aria-hidden>↻</span>
            </button>
            <button onClick={this.reset} className="caption hover:text-acid">
              ← try again
            </button>
          </div>
          {process.env.NODE_ENV !== "production" ? (
            <pre className="mt-10 max-w-2xl overflow-auto rounded border border-rule bg-ink-2 p-4 text-left text-xs text-bone-3">
              {this.state.error.message}
            </pre>
          ) : null}
        </main>
      );
    }
    return this.props.children;
  }
}
