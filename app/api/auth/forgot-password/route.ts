import { NextRequest } from 'next/server';
import { z } from 'zod';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { sendPasswordReset } from '@/lib/email';
import { generatePasswordResetToken } from '@/lib/jwt';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { forgotPasswordSchema } from '@/lib/validations';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);
    await connectToDatabase();
    const user = await User.findOne({ email });
    if (!user) {
      return successResponse({ message: 'If an account with this email exists, a password reset link has been sent.' });
    }
    const resetToken = generatePasswordResetToken(user._id.toString());
    user.passwordResetToken = resetToken;
    user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();
    try {
      await sendPasswordReset(user.email, resetToken);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
    }

    return successResponse({ message: 'If an account with this email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);

    if (error instanceof z.ZodError) {
      return errorResponse('Validation failed', 400, error.issues);
    }

    return errorResponse('Internal server error', 500);
  }
}