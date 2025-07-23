export function validateUsername(username: string): { valid: boolean; error?: string } {
  // Check length (3-30 characters)
  if (username.length < 3 || username.length > 30) {
    return { valid: false, error: 'Username must be between 3 and 30 characters' };
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
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }

  return { valid: true };
}