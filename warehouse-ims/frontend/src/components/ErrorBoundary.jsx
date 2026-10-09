import React from "react";
import { AlertOctagon } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Unhandled UI error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-text flex flex-col items-center justify-center px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-danger/15 flex items-center justify-center mb-5">
            <AlertOctagon className="w-8 h-8 text-danger" />
          </div>
          <h1 className="text-3xl font-display font-extrabold mb-2">Something went wrong</h1>
          <p className="text-text-secondary max-w-sm mb-8">
            An unexpected error occurred. Try reloading the page — if it keeps happening,
            let your administrator know.
          </p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
