import { Component } from 'react'
import { HiOutlineExclamationCircle } from 'react-icons/hi'
import Button from './Button'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
          <HiOutlineExclamationCircle className="mb-4 h-16 w-16 text-red-500" />
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Something went wrong</h2>
          <p className="mb-6 max-w-md text-gray-600">
            We encountered an unexpected error while loading this page. Please try refreshing or return to the dashboard.
          </p>
          
          <div className="mb-6 w-full max-w-3xl overflow-auto rounded-lg bg-red-50 p-4 text-left">
            <p className="font-mono text-sm font-semibold text-red-800">
              {this.state.error?.toString()}
            </p>
            {this.state.errorInfo && (
              <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-red-600">
                {this.state.errorInfo.componentStack}
              </pre>
            )}
          </div>

          <div className="flex gap-4">
            <Button onClick={() => window.location.reload()} variant="outline">
              Refresh Page
            </Button>
            <Button onClick={() => window.location.href = '/dashboard'}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
