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
      <div className="bg-white border border-red-200 rounded-lg p-8 text-center">
        <div className="text-red-500 mb-4">
          <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-gray-600 mb-6">{description}</p>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-2">
              Error Details (Development Mode)
            </summary>
            <div className="bg-gray-100 border border-gray-200 rounded p-4 max-h-48 overflow-auto">
              <pre className="text-xs text-gray-800">
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
            className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="bg-gray-300 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Go Back
          </button>
          
          <a
            href="/"
            className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            Home Page
          </a>
        </div>
      </div>
    </div>
  );
}