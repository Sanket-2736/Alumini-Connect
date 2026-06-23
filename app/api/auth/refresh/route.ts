import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { verifyRefreshToken, generateAccessToken } from '@/lib/jwt';
import { successResponse, errorResponse } from '@/lib/apiResponse';


export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value;
    if (!refreshToken) {
      return errorResponse('Refresh token not found', 401);
    }
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return errorResponse('Invalid refresh token', 401);
    }
    await connectToDatabase();
    const user = await User.findById(payload.userId);
    if (!user) {
      return errorResponse('User not found', 401);
    }
    if (user.isBanned) {
      return errorResponse('Your account has been banned', 403);
    }
    let isValidRefreshToken = false;
    for (const hashedToken of user.refreshTokens) {
      if (await bcrypt.compare(refreshToken, hashedToken)) {
        isValidRefreshToken = true;
        break;
      }
    }

    if (!isValidRefreshToken) {
      user.refreshTokens = [];
      await user.save();
      return errorResponse('Invalid refresh token', 401);
    }
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
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return errorResponse('Internal server error', 500);
  }
}