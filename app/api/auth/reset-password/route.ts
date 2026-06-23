import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { verifyPasswordResetToken } from '@/lib/jwt';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { resetPasswordSchema } from '@/lib/validations';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);
    const userId = verifyPasswordResetToken(token);
    if (!userId) {
      return errorResponse('Invalid or expired reset token', 400);
    }
    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse('User not found', 404);
    }
    if (user.passwordResetToken !== token || !user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      return errorResponse('Invalid or expired reset token', 400);
    }
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    user.passwordHash = passwordHash;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    user.refreshTokens = []; // Invalidate all refresh tokens for security
    await user.save();

    return successResponse({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);

    if (error instanceof z.ZodError) {
      return errorResponse('Validation failed', 400, error.issues);
    }

    return errorResponse('Internal server error', 500);
  }
}