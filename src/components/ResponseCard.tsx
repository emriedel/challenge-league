'use client';

interface ResponseCardProps {
  response: {
    id: string;
    caption: string;
    imageUrl: string;
    submittedAt: string;
    publishedAt: string | null;
    user: {
      username: string;
    };
  };
}

export default function ResponseCard({ response }: ResponseCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* User Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {response.user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {response.user.username}
              </p>
              <p className="text-xs text-gray-500">
                {formatDate(response.submittedAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Image */}
      <div className="aspect-square relative bg-gray-100">
        <img
          src={response.imageUrl}
          alt={`Photo by ${response.user.username}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNjAgMTYwSDI0MFYyNDBIMTYwVjE2MFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwVjIyMEgxODBWMjAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
          }}
        />
      </div>

      {/* Caption */}
      <div className="px-4 py-3">
        <p className="text-gray-900 text-sm leading-relaxed">
          {response.caption}
        </p>
      </div>
    </div>
  );
}