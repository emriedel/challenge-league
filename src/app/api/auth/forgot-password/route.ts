import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail, generateToken, getPasswordResetUrl } from '@/lib/email';
import { PasswordResetEmail } from '@/emails/PasswordReset';
import { validateEmail } from '@/lib/validations';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    // Always return success to prevent email enumeration
    // But only send email if user exists
    if (user) {
      // Generate reset token
      const resetToken = generateToken();
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Save token to database
      await db.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      // Generate reset URL
      const resetUrl = getPasswordResetUrl(resetToken);

      // Send password reset email
      // TODO: Re-enable when email system is launched
      // try {
      //   await sendEmail({
      //     to: user.email,
      //     subject: 'Reset Your Challenge League Password',
      //     react: PasswordResetEmail({
      //       username: user.username,
      //       resetUrl,
      //     }),
      //   });
      // } catch (emailError) {
      //   console.error('Failed to send password reset email:', emailError);
      //   // Continue - don't expose email sending failures to user
      // }
      console.log(`Password reset email would be sent to: ${user.email} (currently disabled)`);
    }

    // Always return success message (security best practice)
    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Error in forgot-password endpoint:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
