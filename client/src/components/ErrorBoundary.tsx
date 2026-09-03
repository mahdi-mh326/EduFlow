import { Component, type ReactNode } from 'react'
import { AlertCircleIcon } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('Unhandled UI error:', error, errorInfo)

    // Handle Vite/Webpack dynamic chunk loading errors after new deployments
    const isChunkError =
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed') ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes("Unexpected token '<'")

    if (isChunkError) {
      const retryKey = 'eduflow_chunk_reload_' + window.location.pathname
      if (!sessionStorage.getItem(retryKey)) {
        sessionStorage.setItem(retryKey, 'true')
        window.location.reload()
      }
    }
  }

  handleRetry = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6">
          <div className="max-w-md text-center">
            <div className="mb-4 flex justify-center text-error">
              <AlertCircleIcon className="h-12 w-12" />
            </div>
            <h1 className="text-2xl font-bold text-text">Something went wrong</h1>
            <p className="mt-2 text-sm text-gray-500">
              We hit an unexpected issue while loading this page. You can try again or return home.
            </p>
            {this.state.error?.message && (
              <div className="mt-3 rounded-lg bg-rose-500/10 p-2 text-xs font-mono text-rose-600 border border-rose-500/20 max-w-sm mx-auto overflow-auto">
                {this.state.error.message}
              </div>
            )}
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button variant="primary" onClick={this.handleRetry}>
                Refresh Page
              </Button>
              <Button variant="ghost" onClick={() => (window.location.href = '/')}>
                Go Home
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }

}
