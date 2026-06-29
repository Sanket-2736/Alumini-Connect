import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { VerificationStatus } from '@/lib/enums';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Get 4 random verified alumni
    const alumni = await User.aggregate([
      {
        $match: {
          verificationStatus: VerificationStatus.APPROVED,
          role: 'alumni',
        },
      },
      { $sample: { size: 4 } },
      {
        $project: {
          _id: 1,
          fullName: 1,
          profilePicture: 1,
          batch: 1,
          department: 1,
          workDetails: 1,
        },
      },
    ]);

    return successResponse({
      alumni: alumni.map((alum) => ({
        _id: alum._id.toString(),
        fullName: alum.fullName,
        profilePicture: alum.profilePicture,
        batch: alum.batch,
        department: alum.department,
        currentCompany: alum.workDetails?.company || 'Not specified',
        jobTitle: alum.workDetails?.jobTitle || 'Professional',
      })),
    });
  } catch (error) {
    console.error('Error fetching featured alumni:', error);
    return errorResponse('Failed to fetch alumni', 500);
  }
}
