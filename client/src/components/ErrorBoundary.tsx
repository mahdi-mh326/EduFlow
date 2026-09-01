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
    if (import.meta.env.DEV) {
      console.error('Unhandled UI error:', error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
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
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button variant="primary" onClick={this.handleRetry}>
                Try Again
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
