import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createPublicMethodHandlers } from '@/lib/apiMethods';
import { db } from '@/lib/db';
import { validateEmail, validatePassword, validateUsername } from '@/lib/validations';

// Dynamic export is handled by the API handler
export { dynamic } from '@/lib/apiMethods';

export const { POST } = createPublicMethodHandlers({
  POST: async ({ req }) => {
    const { email, password, username } = await req.json();

    // Validate input
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json({ error: emailValidation.error }, { status: 400 });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.error }, { status: 400 });
    }

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return NextResponse.json({ error: usernameValidation.error }, { status: 400 });
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
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
      }
      if (existingUser.username === username) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
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