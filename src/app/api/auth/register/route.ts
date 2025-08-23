import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createPublicMethodHandlers } from '@/lib/apiMethods';
import { db } from '@/lib/db';
import { validateEmail, validatePassword, validateUsername } from '@/lib/validations';
import { ValidationError, ConflictError } from '@/lib/apiErrors';

// Dynamic export is handled by the API handler
export { dynamic } from '@/lib/apiMethods';

export const { POST } = createPublicMethodHandlers({
  POST: async ({ req }) => {
    const { email, password, username } = await req.json();

    // Validate input
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      throw new ValidationError(emailValidation.error || 'Invalid email');
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new ValidationError(passwordValidation.error || 'Invalid password');
    }

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      throw new ValidationError(usernameValidation.error || 'Invalid username');
    }

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictError('User with this email already exists');
      }
      if (existingUser.username === username) {
        throw new ConflictError('Username is already taken');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
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
});