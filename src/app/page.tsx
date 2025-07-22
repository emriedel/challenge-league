export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Glimpse
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          A social media experience that encourages meaningful sharing through
          weekly photo prompts. Every Saturday at noon PT, new prompts are
          released and previous responses are published simultaneously.
        </p>
        <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          <a
            href="/gallery"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            View Gallery
          </a>
          <a
            href="/submit"
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Submit Response
          </a>
        </div>
      </div>
      
      <div className="mt-16 grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            How It Works
          </h3>
          <ul className="space-y-2 text-gray-600">
            <li>• New prompt every Saturday at 12 PM PT</li>
            <li>• You have exactly 7 days to respond</li>
            <li>• All responses published simultaneously</li>
            <li>• Friends-only sharing for authentic connections</li>
          </ul>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            The Philosophy
          </h3>
          <ul className="space-y-2 text-gray-600">
            <li>• Quality over quantity</li>
            <li>• Synchronized sharing moments</li>
            <li>• No editing after submission</li>
            <li>• Ephemeral content that doesn&apos;t last forever</li>
          </ul>
        </div>
      </div>
    </div>
  );
}