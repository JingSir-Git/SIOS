"use client";

import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[SIOS ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="rounded-full bg-red-500/10 p-4 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200 mb-2">
            {this.props.fallbackMessage || "出现了一个错误"}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mb-4">
            {this.state.error?.message || "未知错误"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
