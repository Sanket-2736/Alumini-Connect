import { NextRequest, NextResponse } from 'next/server';
import { generateAccessToken } from '@/lib/jwt';
import { errorResponse, successResponse } from '@/lib/apiResponse';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    // Get admin credentials from environment
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';

    // Verify credentials
    if (email !== adminEmail || password !== adminPassword) {
      console.error('❌ Invalid admin credentials');
      return errorResponse('Invalid email or password', 401);
    }

    // Generate JWT token
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
