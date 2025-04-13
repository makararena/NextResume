"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import { monitoring } from "@/lib/monitoring";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to our monitoring service
    monitoring.logError({
      message: "React error boundary caught an error",
      error,
      metadata: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            We&apos;ve encountered an unexpected error. Our team has been notified and is working to fix the issue.
          </p>
          <div className="space-x-4">
            <Button onClick={() => window.location.reload()}>
              Refresh page
            </Button>
            <Button variant="outline" onClick={this.handleReset}>
              Try again
            </Button>
          </div>
          {process.env.NODE_ENV !== "production" && (
            <div className="mt-8 p-4 bg-destructive/10 text-destructive rounded-md text-sm text-left w-full max-w-xl overflow-auto">
              <p className="font-semibold">{this.state.error?.name}: {this.state.error?.message}</p>
              <pre className="mt-2 text-xs overflow-auto max-h-[300px]">{this.state.error?.stack}</pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 