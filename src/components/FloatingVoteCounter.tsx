'use client';


interface FloatingVoteCounterProps {
  votesCount: number;
  maxVotes: number;
  isVisible: boolean;
  hasSubmittedVotes?: boolean;
}

export default function FloatingVoteCounter({
  votesCount,
  maxVotes,
  isVisible,
  hasSubmittedVotes = false
}: FloatingVoteCounterProps) {
  const hasMaxVotes = votesCount === maxVotes;

  return (
    <div className="fixed bottom-20 right-4 z-50 bg-red-500 p-4 border-2 border-yellow-400"
         style={{ backgroundColor: 'red', border: '3px solid yellow' }}>
      <div className={`bg-app-surface/85 backdrop-blur-md border border-app-border/50 shadow-lg ${
        hasMaxVotes ? 'rounded-lg px-3 py-2' : 'rounded-full px-3 py-1.5'
      }`}>
        <div className="text-xs font-medium text-app-text whitespace-nowrap text-center">
          <div>
            {votesCount}/{maxVotes} votes cast
          </div>
          {hasMaxVotes && (
            <div className="text-blue-400 mt-1 font-semibold">
              Ready to submit!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}