import Image from 'next/image';

interface ProfileAvatarProps {
  username: string;
  profilePhoto?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base', 
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl'
};

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

  // Fallback: Circle with first letter of username
  return (
    <div 
      className={`${sizeClasses} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold ${className}`}
      title={`${username}'s profile`}
    >
      {firstLetter}
    </div>
  );
}