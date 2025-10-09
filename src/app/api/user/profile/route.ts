import { NextResponse } from 'next/server';
import { createMethodHandlers } from '@/lib/apiMethods';
import { db } from '@/lib/db';
import { validateUsername } from '@/lib/validations';
import { sanitizeUsername } from '@/lib/sanitize';
import type { AuthenticatedApiContext } from '@/lib/apiHandler';
import { ValidationError, ConflictError } from '@/lib/apiErrors';

// Dynamic export is handled by the API handler
export { dynamic } from '@/lib/apiMethods';

const updateProfile = async ({ req, session }: AuthenticatedApiContext) => {
  const { username } = await req.json();

  // Validate that username is provided
  if (!username) {
    throw new ValidationError('Username is required');
  }

  // Sanitize username
  const sanitizedUsername = sanitizeUsername(username);

  // Validate username format
  const usernameValidation = validateUsername(sanitizedUsername);
  if (!usernameValidation.valid) {
    throw new ValidationError(usernameValidation.error || 'Invalid username');
  }

  // Check if username is already taken by another user (case-insensitive)
  const existingUser = await db.user.findFirst({
    where: {
      username: { equals: sanitizedUsername, mode: 'insensitive' },
      NOT: {
        id: session.user.id, // Exclude current user
      },
    },
  });

  if (existingUser) {
    throw new ConflictError('Username is already taken');
  }

  // Update user's username
  const updatedUser = await db.user.update({
    where: { id: session.user.id },
    data: { username: sanitizedUsername },
    select: {
      id: true,
      email: true,
      username: true,
      profilePhoto: true,
    },
  });

  return NextResponse.json({
    success: true,
    user: updatedUser,
  });
};

export const { PATCH } = createMethodHandlers({
  PATCH: updateProfile,
}, true, 'mutations');
