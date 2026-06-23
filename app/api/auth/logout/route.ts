import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { verifyRefreshToken } from '@/lib/jwt';
import { successResponse, errorResponse } from '@/lib/apiResponse';


export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (refreshToken) {
      const payload = verifyRefreshToken(refreshToken);
      if (payload) {
        await connectToDatabase();
        const user = await User.findById(payload.userId);
        if (user) {
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