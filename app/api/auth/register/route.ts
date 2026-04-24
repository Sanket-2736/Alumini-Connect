import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { sendEmailVerification } from '@/lib/email';
import { generateEmailVerificationToken } from '@/lib/jwt';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { registerSchema } from '@/lib/validations';

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Connect to database
    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return errorResponse('User with this email already exists', 409);
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(validatedData.password, saltRounds);

    // Generate email verification token
    const emailVerificationToken = generateEmailVerificationToken('temp-id'); // We'll update this after creating user

    // Create user
    const user = new User({
      fullName: validatedData.fullName,
      email: validatedData.email,
      passwordHash,
      role: validatedData.role,
      university: validatedData.university, // This should be ObjectId, but for now string
      department: validatedData.department,
      batch: validatedData.batch,
      emailVerificationToken,
      skills: [],
      verificationDocs: [],
      refreshTokens: [],
    });

    await user.save();

    // Update token with actual user ID
    user.emailVerificationToken = generateEmailVerificationToken(user._id.toString());
    await user.save();

    // Send verification email
    try {
      await sendEmailVerification(user.email, user.emailVerificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails, but log it
    }

    return successResponse(
      { userId: user._id },
      'User registered successfully. Please check your email to verify your account.',
      201
    );
  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof z.ZodError) {
      return errorResponse('Validation failed', 400, error.issues);
    }

    return errorResponse('Internal server error', 500);
  }
}