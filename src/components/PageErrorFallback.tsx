interface PageErrorFallbackProps {
  error?: Error;
  resetError: () => void;
  title?: string;
  description?: string;
}

export default function PageErrorFallback({
  error,
  resetError,
  title = "Page Error",
  description = "This page encountered an error. Please try again."
}: PageErrorFallbackProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-app-surface border border-app-border rounded-lg p-8 text-center">
        <div className="text-app-error mb-4">
          <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-app-text mb-4">{title}</h1>
        <p className="text-app-text-secondary mb-6">{description}</p>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-app-text-muted hover:text-app-text-secondary mb-2">
              Error Details (Development Mode)
            </summary>
            <div className="bg-app-surface-dark border border-app-border-dark rounded p-4 max-h-48 overflow-auto">
              <pre className="text-xs text-app-text-secondary">
                <strong>Message:</strong> {error.message}
                {error.stack && (
                  <>
                    <br /><br />
                    <strong>Stack Trace:</strong>
                    <br />
                    {error.stack}
                  </>
                )}
              </pre>
            </div>
          </details>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={resetError}
            className="bg-app-info text-white py-2 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Try Again
          </button>

          <button
            onClick={() => window.history.back()}
            className="bg-app-surface-light text-app-text py-2 px-6 rounded-lg hover:bg-app-surface-light/80 border border-app-border focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Go Back
          </button>

          <a
            href="/app"
            className="bg-[#3a8e8c] text-white py-2 px-6 rounded-lg hover:bg-[#2f7270] focus:outline-none focus:ring-2 focus:ring-[#3a8e8c] focus:ring-offset-2 transition-colors"
          >
            Home Page
          </a>
        </div>
      </div>
    </div>
  );
}