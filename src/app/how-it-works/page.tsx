export default function HowItWorksPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">How Challenge League Works</h1>
        <p className="text-xl text-gray-600">
          Join creative competitions and compete with friends through weekly photo challenges
        </p>
      </div>

      <div className="space-y-12">
        {/* 3-Phase Competition Cycle */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">🔄 3-Phase Competition Cycle</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="text-2xl mb-2">📸</div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">Submission Phase</h3>
              <p className="text-green-700 text-sm mb-3">7 days to submit creative responses</p>
              <p className="text-green-600 text-xs">Saturday 12 PM PT to next Saturday 12 PM PT</p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="text-2xl mb-2">🗳️</div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Voting Phase</h3>
              <p className="text-blue-700 text-sm mb-3">2 days to vote on submissions</p>
              <p className="text-blue-600 text-xs">Saturday 12 PM PT to Monday 12 PM PT</p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="text-2xl mb-2">🏆</div>
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Results Phase</h3>
              <p className="text-purple-700 text-sm mb-3">Winners announced, next challenge begins</p>
              <p className="text-purple-600 text-xs">Monday 12 PM PT to Saturday 12 PM PT</p>
            </div>
          </div>
        </section>

        {/* How to Play */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">🎮 How to Play</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <ol className="space-y-4">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">1</span>
                <div>
                  <h4 className="font-medium text-gray-900">Join a League</h4>
                  <p className="text-gray-600 text-sm">New players automatically join the Main League to start competing</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">2</span>
                <div>
                  <h4 className="font-medium text-gray-900">Submit Creative Responses</h4>
                  <p className="text-gray-600 text-sm">Take photos and add captions responding to weekly creative challenges</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">3</span>
                <div>
                  <h4 className="font-medium text-gray-900">Vote for Winners</h4>
                  <p className="text-gray-600 text-sm">Rank your top 3 favorite submissions (3pts, 2pts, 1pt scoring)</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">4</span>
                <div>
                  <h4 className="font-medium text-gray-900">Climb the Leaderboard</h4>
                  <p className="text-gray-600 text-sm">Earn points to rise in rankings and compete for league supremacy</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* Challenge Examples */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">💡 Sample Challenges</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span className="text-gray-700">"Submit a photo of a beautiful dinner you made this week"</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span className="text-gray-700">"Create something artistic with household items and share the result"</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span className="text-gray-700">"Capture an interesting shadow or reflection in your daily life"</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span className="text-gray-700">"Visit somewhere you've never been before and document it"</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span className="text-gray-700">"Show us your workspace or favorite creative corner"</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span className="text-gray-700">"Photograph something that represents your mood today"</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Voting Rules */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">🗳️ Voting Rules</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <ul className="space-y-2 text-blue-700">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                You get exactly 3 votes to cast among all submissions
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Each vote counts for 1 point (all votes are equal value)
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                You can vote for different submissions or give multiple votes to the same submission
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                You cannot vote for your own submission
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Voting is anonymous, but results are public
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Voting window: 48 hours after submissions close
              </li>
            </ul>
          </div>
        </section>

        {/* Ready to Start */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Ready to Start Competing?</h2>
            <p className="text-gray-600 mb-6">
              Join the Main League and start participating in creative challenges today!
            </p>
            <a
              href="/league/main"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Main League →
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}