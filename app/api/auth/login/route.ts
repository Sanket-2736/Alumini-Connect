import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { loginSchema } from '@/lib/validations';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);
    await connectToDatabase();
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return errorResponse('Invalid email or password', 401);
    }
    if (user.verificationStatus !== 'approved') {
      if (user.verificationStatus === 'pending') {
        return errorResponse('Your account is pending admin verification. Please wait.', 401);
      } else if (user.verificationStatus === 'rejected') {
        return errorResponse(`Your account was rejected. Reason: ${user.rejectionReason || 'No reason provided'}`, 403);
      } else {
        return errorResponse('Please upload your verification documents to complete registration', 401);
      }
    }
    if (user.isBanned) {
      return errorResponse('Your account has been banned', 403);
    }
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return errorResponse('Invalid email or password', 401);
    }
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);
    user.refreshTokens.push(hashedRefreshToken);
    await user.save();
    const response = successResponse({
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
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);

    if (error instanceof z.ZodError) {
      return errorResponse('Validation failed', 400, error.issues);
    }

    return errorResponse('Internal server error', 500);
  }
}