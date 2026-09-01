import React from 'react'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Catches any uncaught render error and shows a recovery screen instead of
 * letting React unmount the entire application (which produces a blank page).
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Surface the real error for debugging instead of hiding it.
    console.error('[ErrorBoundary] Uncaught render error:', error, info)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <h2 className="text-base font-bold text-gray-900">Something went wrong</h2>
            <p className="text-xs text-gray-500">
              This page hit an error. Your data is safe. You can try again below.
            </p>
            {this.state.error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-left text-[11px] text-rose-700 break-words">
                <p className="font-bold mb-1">Error details:</p>
                <code>{this.state.error.message}</code>
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
