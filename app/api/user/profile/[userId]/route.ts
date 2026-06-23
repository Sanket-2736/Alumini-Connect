import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import University from '@/models/University';
import { successResponse, errorResponse } from '@/lib/apiResponse';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    await connectToDatabase();
    let user = await User.findOne({ _id: userId, isBanned: false })
      .select('_id fullName email profilePicture bio university department batch workDetails skills socialLinks verificationStatus createdAt')
      .populate('university', 'name slug');
    if (!user) {
      user = await User.findById(userId)
        .select('_id fullName email profilePicture bio university department batch workDetails skills socialLinks verificationStatus createdAt isBanned')
        .populate('university', 'name slug');
      if (user && user.isBanned) {
        return errorResponse('User not found', 404);
      }
    }

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse({
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        university: user.university,
        department: user.department,
        batch: user.batch,
        workDetails: user.workDetails,
        skills: user.skills,
        socialLinks: user.socialLinks,
        verificationStatus: user.verificationStatus,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    return errorResponse('Internal server error', 500);
  }
}