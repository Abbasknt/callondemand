"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
    if (
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('failed to fetch dynamically imported module')
    ) {
      if (typeof window !== 'undefined' && !sessionStorage.getItem('chunk_reload_attempted')) {
        sessionStorage.setItem('chunk_reload_attempted', 'true')
        window.location.reload()
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 px-4 py-8">
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            {this.state.error?.message?.includes('Loading chunk')
              ? "Updating application modules... Please reload."
              : "An unexpected error occurred."}
          </p>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem('chunk_reload_attempted')
                window.location.reload()
              } else {
                this.setState({ hasError: false, error: null })
              }
            }}
            className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl shadow hover:bg-primary/90 transition-all"
          >
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
