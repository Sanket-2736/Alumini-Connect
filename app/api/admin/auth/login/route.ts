import { NextRequest, NextResponse } from 'next/server';
import { generateAccessToken } from '@/lib/jwt';
import { errorResponse, successResponse } from '@/lib/apiResponse';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
    if (email !== adminEmail || password !== adminPassword) {
      console.error('❌ Invalid admin credentials');
      return errorResponse('Invalid email or password', 401);
    }
    const token = generateAccessToken({
      userId: 'admin',
      email: adminEmail,
      role: 'admin',
    });

    console.log('✅ Admin login successful, token generated');

    return successResponse({ token }, 'Login successful');
  } catch (error) {
    console.error('Admin login error:', error);
    return errorResponse('Login failed', 500);
  }
}
