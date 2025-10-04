import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@challenge-league.app';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://challenge-league.app';

export interface EmailOptions {
  to: string;
  subject: string;
  react: React.ReactElement;
}

/**
 * Send an email using Resend
 */
export async function sendEmail({ to, subject, react }: EmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured');
    throw new Error('Email service is not configured');
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      react,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }

    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Generate a secure random token for password reset or email verification
 */
export function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const randomValues = new Uint8Array(32);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < randomValues.length; i++) {
    token += chars[randomValues[i] % chars.length];
  }

  return token;
}

/**
 * Get the app URL for email links
 */
export function getAppUrl(): string {
  return APP_URL;
}

/**
 * Generate a password reset link
 */
export function getPasswordResetUrl(token: string): string {
  return `${APP_URL}/app/auth/reset-password?token=${token}`;
}

/**
 * Generate an email verification link
 */
export function getEmailVerificationUrl(token: string): string {
  return `${APP_URL}/app/auth/verify-email?token=${token}`;
}
