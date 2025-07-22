export default function Gallery() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gallery</h1>
        <p className="text-gray-600">
          View responses from your friends to last week&apos;s prompt
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No responses yet</h3>
        <p className="text-gray-500 mb-4">
          The gallery will show your friends&apos; responses once the current submission window closes.
        </p>
        <p className="text-sm text-gray-400">
          Note: This is a placeholder. Gallery functionality will be implemented in later steps.
        </p>
      </div>
    </div>
  );
}