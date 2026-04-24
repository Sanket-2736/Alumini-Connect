import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { verifyEmailVerificationToken } from '@/lib/jwt';
import { successResponse, errorResponse } from '@/lib/apiResponse';

/**
 * GET /api/auth/verify-email?token=
 * Verify user's email address
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return errorResponse('Verification token is required', 400);
    }

    // Verify token
    const userId = verifyEmailVerificationToken(token);
    if (!userId) {
      return errorResponse('Invalid or expired verification token', 400);
    }

    // Connect to database
    await connectToDatabase();

    // Find and update user
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    if (user.isEmailVerified) {
      return successResponse({ message: 'Email already verified' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined; // Clear the token
    await user.save();

    return successResponse({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    return errorResponse('Internal server error', 500);
  }
}