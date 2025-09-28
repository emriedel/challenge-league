import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createPublicMethodHandlers } from '@/lib/apiMethods';
import { db } from '@/lib/db';
import { validateEmail, validatePassword, validateUsername } from '@/lib/validations';
import { ValidationError, ConflictError } from '@/lib/apiErrors';
import { sanitizeText, sanitizeUsername } from '@/lib/sanitize';
import { withAuthRateLimit } from '@/lib/rateLimit';

// Dynamic export is handled by the API handler
export { dynamic } from '@/lib/apiMethods';

export const { POST } = createPublicMethodHandlers({
  POST: async ({ req }) => {
    const { email, password, username } = await req.json();

    // Sanitize inputs first
    const sanitizedEmail = sanitizeText(email).toLowerCase();
    const sanitizedUsername = sanitizeUsername(username);
    const sanitizedPassword = typeof password === 'string' ? password : '';

    // Validate input
    const emailValidation = validateEmail(sanitizedEmail);
    if (!emailValidation.valid) {
      throw new ValidationError(emailValidation.error || 'Invalid email');
    }

    const passwordValidation = validatePassword(sanitizedPassword);
    if (!passwordValidation.valid) {
      throw new ValidationError(passwordValidation.error || 'Invalid password');
    }

    const usernameValidation = validateUsername(sanitizedUsername);
    if (!usernameValidation.valid) {
      throw new ValidationError(usernameValidation.error || 'Invalid username');
    }

    // Check if user already exists (using sanitized values)
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email: sanitizedEmail },
          { username: { equals: sanitizedUsername, mode: 'insensitive' } },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === sanitizedEmail) {
        throw new ConflictError('User with this email already exists');
      }
      if (existingUser.username === sanitizedUsername) {
        throw new ConflictError('Username is already taken');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(sanitizedPassword, 12);

    // Create user (using sanitized values)
    const user = await db.user.create({
      data: {
        email: sanitizedEmail,
        password: hashedPassword,
        username: sanitizedUsername,
      },
    });

    // Return user without password
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  }
}, 'auth'); // Apply strict rate limiting for authentication endpoints