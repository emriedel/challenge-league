import { CONTENT_LIMITS } from '@/constants/app';

export function validateUsername(username: string): { valid: boolean; error?: string } {
  // Check length
  if (username.length < CONTENT_LIMITS.USERNAME_MIN_LENGTH || username.length > CONTENT_LIMITS.USERNAME_MAX_LENGTH) {
    return { valid: false, error: `Username must be between ${CONTENT_LIMITS.USERNAME_MIN_LENGTH} and ${CONTENT_LIMITS.USERNAME_MAX_LENGTH} characters` };
  }

  // Check if it starts with letter or number
  if (!/^[a-zA-Z0-9]/.test(username)) {
    return { valid: false, error: 'Username must start with a letter or number' };
  }

  // Check if it only contains allowed characters (letters, numbers, underscores, hyphens)
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }

  // Check for reserved words
  const reservedWords = [
    'admin', 'api', 'app', 'blog', 'chat', 'contact', 'dev', 'ftp', 'help',
    'login', 'mail', 'news', 'root', 'shop', 'support', 'test', 'www',
    'glimpse', 'submit', 'gallery', 'auth', 'register', 'signin', 'signup'
  ];
  
  if (reservedWords.includes(username.toLowerCase())) {
    return { valid: false, error: 'This username is reserved' };
  }

  return { valid: true };
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < CONTENT_LIMITS.PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${CONTENT_LIMITS.PASSWORD_MIN_LENGTH} characters long` };
  }

  return { valid: true };
}