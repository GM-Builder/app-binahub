"use client";

import { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center" role="alert">
          <AlertCircle size={32} className="mx-auto text-red-400" aria-hidden="true" />
          <h3 className="mt-3 text-sm font-semibold text-red-700">Terjadi kesalahan</h3>
          <p className="mt-1 text-xs text-red-600/70">
            {this.state.error?.message || "Gagal memuat data. Silakan coba lagi."}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            aria-label="Coba muat ulang"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            <RefreshCw size={12} aria-hidden="true" /> Coba Lagi
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
