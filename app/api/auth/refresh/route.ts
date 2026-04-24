import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { verifyRefreshToken, generateAccessToken } from '@/lib/jwt';
import { successResponse, errorResponse } from '@/lib/apiResponse';

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token from cookie
 */
export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = request.cookies.get('refreshToken')?.value;
    if (!refreshToken) {
      return errorResponse('Refresh token not found', 401);
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return errorResponse('Invalid refresh token', 401);
    }

    // Connect to database
    await connectToDatabase();

    // Find user
    const user = await User.findById(payload.userId);
    if (!user) {
      return errorResponse('User not found', 401);
    }

    // Check if user is banned
    if (user.isBanned) {
      return errorResponse('Your account has been banned', 403);
    }

    // Verify refresh token is in user's stored tokens
    let isValidRefreshToken = false;
    for (const hashedToken of user.refreshTokens) {
      if (await bcrypt.compare(refreshToken, hashedToken)) {
        isValidRefreshToken = true;
        break;
      }
    }

    if (!isValidRefreshToken) {
      // Clear all refresh tokens if invalid token found
      user.refreshTokens = [];
      await user.save();
      return errorResponse('Invalid refresh token', 401);
    }

    // Generate new access token
    const newPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(newPayload);

    return successResponse({
      accessToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return errorResponse('Internal server error', 500);
  }
}