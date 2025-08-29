// Ranking display utility with medal colors for results
export const getRankBadge = (rank: number) => {
  switch (rank) {
    case 1:
      return {
        text: '#1',
        className: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
      };
    case 2:
      return {
        text: '#2',
        className: 'bg-gradient-to-r from-gray-300 to-gray-500 text-white'
      };
    case 3:
      return {
        text: '#3',
        className: 'bg-gradient-to-r from-amber-600 to-amber-800 text-white'
      };
    default:
      return {
        text: `#${rank}`,
        className: 'bg-gradient-to-r from-blue-400 to-blue-600 text-white'
      };
  }
};

