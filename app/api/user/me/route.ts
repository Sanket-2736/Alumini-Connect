import { NextRequest } from 'next/server';
import { z } from 'zod';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { updateProfileSchema } from '@/lib/validations';

/**
 * GET /api/user/me
 * Get current user's profile
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return errorResponse('User not authenticated', 401);
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Return user profile without sensitive data
    const profile = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      university: user.university,
      department: user.department,
      batch: user.batch,
      profilePicture: user.profilePicture,
      bio: user.bio,
      workDetails: user.workDetails,
      skills: user.skills,
      socialLinks: user.socialLinks,
      verificationStatus: user.verificationStatus,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return successResponse(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    return errorResponse('Internal server error', 500);
  }
}

/**
 * PUT /api/user/me
 * Update current user's profile
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return errorResponse('User not authenticated', 401);
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Update allowed fields
    if (validatedData.fullName !== undefined) user.fullName = validatedData.fullName;
    if (validatedData.bio !== undefined) user.bio = validatedData.bio;
    if (validatedData.workDetails !== undefined) user.workDetails = validatedData.workDetails;
    if (validatedData.skills !== undefined) user.skills = validatedData.skills;
    if (validatedData.socialLinks !== undefined) user.socialLinks = validatedData.socialLinks;
    if (validatedData.batch !== undefined) user.batch = validatedData.batch;
    if (validatedData.department !== undefined) user.department = validatedData.department;

    await user.save();

    return successResponse({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);

    if (error instanceof z.ZodError) {
      return errorResponse('Validation failed', 400, error.issues);
    }

    return errorResponse('Internal server error', 500);
  }
}