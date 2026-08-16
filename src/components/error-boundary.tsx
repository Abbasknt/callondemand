"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error | any | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: any): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: any, errorInfo: ErrorInfo) {
    const errorMsg = error?.message || (typeof error === 'string' ? error : '');
    console.error("App Error Caught:", error, errorInfo)
    if (
      error?.name === 'ChunkLoadError' ||
      errorMsg.includes('Loading chunk') ||
      errorMsg.includes('failed to fetch dynamically imported module')
    ) {
      if (typeof window !== 'undefined' && !sessionStorage.getItem('chunk_reload_attempted')) {
        sessionStorage.setItem('chunk_reload_attempted', 'true')
        window.location.reload()
      }
    }
  }

  private getErrorMessage(): string {
    const { error } = this.state
    if (!error) return "An unexpected error occurred."
    if (typeof error === "string") return error
    if (error?.message) return error.message
    if (error?.isTrusted) return "A network or connection event interrupted page operations."
    try {
      const serialized = JSON.stringify(error)
      if (serialized && serialized !== "{}") return serialized
    } catch {}
    return "An unexpected application error occurred."
  }

  public render() {
    if (this.state.hasError) {
      const message = this.getErrorMessage()
      const isChunkError = message.includes('Loading chunk') || message.includes('module')

      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 px-4 py-12">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mb-2">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Something went wrong</h2>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            {isChunkError ? "Updating application modules... Please reload." : message}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  sessionStorage.removeItem('chunk_reload_attempted')
                  window.location.reload()
                } else {
                  this.setState({ hasError: false, error: null })
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl shadow hover:bg-primary/90 transition-all text-sm"
            >
              <RefreshCw className="w-4 h-4" /> Reload Page
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/'
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary text-secondary-foreground font-semibold rounded-xl hover:bg-secondary/80 transition-all text-sm"
            >
              <Home className="w-4 h-4" /> Go Home
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
