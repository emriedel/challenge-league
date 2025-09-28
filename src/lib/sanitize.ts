import DOMPurify from 'dompurify';

/**
 * Sanitization utilities for preventing XSS attacks
 * Uses DOMPurify to clean user-generated content
 */

// Server-side sanitization (for API endpoints)
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // For server-side, we'll use a simple approach since DOMPurify is primarily for browser
  // Strip HTML tags and normalize whitespace
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[^;]+;/g, '') // Remove HTML entities
    .trim()
    .slice(0, 10000); // Prevent extremely long inputs
}

// Client-side sanitization for display
export function sanitizeHtml(input: string): string {
  if (typeof window === 'undefined') {
    // Server-side fallback
    return sanitizeText(input);
  }

  // Client-side using DOMPurify
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'], // Very limited HTML tags
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  });
}

// Validate and sanitize common user inputs
export function sanitizeUsername(username: string): string {
  if (typeof username !== 'string') {
    return '';
  }

  return username
    .replace(/[^a-zA-Z0-9_-]/g, '') // Only allow alphanumeric, underscore, hyphen
    .slice(0, 30); // Enforce max length - preserve original capitalization
}

export function sanitizeLeagueName(name: string): string {
  if (typeof name !== 'string') {
    return '';
  }

  return sanitizeText(name).slice(0, 50); // Enforce max length
}

export function sanitizeCaption(caption: string): string {
  if (typeof caption !== 'string') {
    return '';
  }

  return sanitizeText(caption).slice(0, 500); // Enforce max length
}

export function sanitizeDescription(description: string): string {
  if (typeof description !== 'string') {
    return '';
  }

  return sanitizeText(description).slice(0, 500); // Enforce max length
}

// Validation helpers
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Helper for safely displaying user content in React components
// Note: Use this in a .tsx file, not here
export function createSafeHTML(children: string): string {
  return sanitizeHtml(children);
}

const sanitizeModule = {
  sanitizeText,
  sanitizeHtml,
  sanitizeUsername,
  sanitizeLeagueName,
  sanitizeCaption,
  sanitizeDescription,
  isValidEmail,
  isValidUrl,
  createSafeHTML,
};

export default sanitizeModule;