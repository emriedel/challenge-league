import Image from 'next/image';

interface ProfileAvatarProps {
  username: string;
  profilePhoto?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl'
};

// Predefined gradient color combinations
const gradientCombos = [
  'from-blue-500 to-purple-600',     // Blue to Purple
  'from-green-500 to-teal-600',      // Green to Teal
  'from-pink-500 to-rose-600',       // Pink to Rose
  'from-orange-500 to-red-600',      // Orange to Red
  'from-indigo-500 to-blue-600',     // Indigo to Blue
  'from-yellow-500 to-orange-600',   // Yellow to Orange
  'from-purple-500 to-pink-600',     // Purple to Pink
  'from-teal-500 to-cyan-600',       // Teal to Cyan
  'from-red-500 to-pink-600',        // Red to Pink
  'from-cyan-500 to-blue-600',       // Cyan to Blue
  'from-emerald-500 to-green-600',   // Emerald to Green
  'from-violet-500 to-purple-600',   // Violet to Purple
  'from-amber-500 to-yellow-600',    // Amber to Yellow
  'from-lime-500 to-green-600',      // Lime to Green
  'from-fuchsia-500 to-pink-600',    // Fuchsia to Pink
  'from-sky-500 to-cyan-600',        // Sky to Cyan
];

// Simple hash function to convert string to number
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Get deterministic gradient based on username
function getGradientForUsername(username: string): string {
  const hash = hashString(username.toLowerCase());
  const index = hash % gradientCombos.length;
  return gradientCombos[index];
}

export default function ProfileAvatar({ 
  username, 
  profilePhoto, 
  size = 'md',
  className = '' 
}: ProfileAvatarProps) {
  const sizeClasses = sizeMap[size];
  const firstLetter = username.charAt(0).toUpperCase();

  if (profilePhoto) {
    return (
      <div className={`${sizeClasses} relative rounded-full overflow-hidden ${className}`}>
        <Image
          src={profilePhoto}
          alt={`${username}'s profile`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 64px, 64px"
        />
      </div>
    );
  }

  // Fallback: Circle with first letter of username and deterministic gradient
  const gradientClasses = getGradientForUsername(username);
  
  return (
    <div 
      className={`${sizeClasses} rounded-full bg-gradient-to-br ${gradientClasses} flex items-center justify-center text-white font-semibold ${className}`}
      title={`${username}'s profile`}
    >
      {firstLetter}
    </div>
  );
}