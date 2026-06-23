import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import University from '@/models/University';
import { successResponse, errorResponse } from '@/lib/apiResponse';

/**
 * GET /api/user/[userId]
 * Get a specific user's public profile
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return errorResponse('User ID is required', 400);
    }

    await connectToDatabase();

    const user = await User.findById(userId)
      .select('-passwordHash -refreshTokens -emailVerificationToken -passwordResetToken -passwordResetExpiry -verificationDocs')
      .populate('university', 'name slug logoUrl');

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Return public profile data
    const profile = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePicture: user.profilePicture,
      university: user.university,
      department: user.department,
      batch: user.batch,
      bio: user.bio,
      workDetails: user.workDetails,
      skills: user.skills,
      socialLinks: user.socialLinks,
      role: user.role,
      verificationStatus: user.verificationStatus,
      createdAt: user.createdAt,
    };

    return successResponse(profile);
  } catch (error) {
    console.error('Get user profile error:', error);
    return errorResponse('Internal server error', 500);
  }
}
