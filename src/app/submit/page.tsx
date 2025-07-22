export default function Submit() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit</h1>
        <p className="text-gray-600">
          Respond to this week&apos;s prompt
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          This Week&apos;s Prompt
        </h2>
        <div className="bg-primary-50 p-4 rounded-lg">
          <p className="text-primary-700 font-medium">
            &quot;Share a photo that represents your favorite moment from this week&quot;
          </p>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <p>⏰ Submission window closes: Saturday, 12:00 PM PT</p>
          <p>Time remaining: 3 days, 14 hours</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Submit Your Response</h3>
          <p className="text-gray-500 mb-4">
            Upload a photo and add your caption to respond to this week&apos;s prompt.
          </p>
          <p className="text-sm text-gray-400">
            Note: This is a placeholder. Submission functionality will be implemented in later steps.
          </p>
        </div>
      </div>
    </div>
  );
}