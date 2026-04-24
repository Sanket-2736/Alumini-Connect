import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { verifyRefreshToken } from '@/lib/jwt';
import { successResponse, errorResponse } from '@/lib/apiResponse';

/**
 * POST /api/auth/logout
 * Logout user by removing refresh token from DB and clearing cookie
 */
export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (refreshToken) {
      // Verify refresh token to get user ID
      const payload = verifyRefreshToken(refreshToken);
      if (payload) {
        // Connect to database
        await connectToDatabase();

        // Find user and remove the refresh token
        const user = await User.findById(payload.userId);
        if (user) {
          // Remove the specific refresh token
          const newRefreshTokens = [];
          for (const hashedToken of user.refreshTokens) {
            if (!(await bcrypt.compare(refreshToken, hashedToken))) {
              newRefreshTokens.push(hashedToken);
            }
          }
          user.refreshTokens = newRefreshTokens;
          await user.save();
        }
      }
    }

    // Create response and clear cookie
    const response = successResponse({ message: 'Logged out successfully' });
    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse('Internal server error', 500);
  }
}