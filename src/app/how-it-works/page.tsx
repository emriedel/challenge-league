export default function HowItWorksPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">How Glimpse Works</h1>
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

        {/* Challenge Categories */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">🎨 Challenge Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Cooking', emoji: '🍳' },
              { name: 'Creativity', emoji: '🎨' },
              { name: 'Photography', emoji: '📷' },
              { name: 'Adventure', emoji: '🗺️' },
              { name: 'Design', emoji: '✏️' },
              { name: 'Fitness', emoji: '💪' },
              { name: 'Art', emoji: '🖼️' },
              { name: 'DIY', emoji: '🔨' },
            ].map((category) => (
              <div key={category.name} className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">{category.emoji}</div>
                <div className="text-sm font-medium text-gray-900">{category.name}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Difficulty Levels */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">⭐ Difficulty Levels</h2>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-lg">⭐</span>
                <h4 className="ml-2 font-medium text-green-900">Easy</h4>
              </div>
              <p className="text-green-700 text-sm">Quick and simple tasks that anyone can complete</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-lg">⭐⭐</span>
                <h4 className="ml-2 font-medium text-yellow-900">Medium</h4>
              </div>
              <p className="text-yellow-700 text-sm">Moderate effort required, some planning needed</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-lg">⭐⭐⭐</span>
                <h4 className="ml-2 font-medium text-red-900">Hard</h4>
              </div>
              <p className="text-red-700 text-sm">Challenging and creative tasks that push your limits</p>
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
                You must vote for exactly 3 submissions (1st, 2nd, 3rd place)
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
                Scoring: 1st place = 3pts, 2nd place = 2pts, 3rd place = 1pt
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