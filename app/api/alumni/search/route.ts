import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { VerificationStatus } from '@/lib/enums';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    if (!query || query.length < 2) {
      return errorResponse('Search query must be at least 2 characters', 400);
    }

    await connectToDatabase();

    // Search across multiple fields with regex
    const searchRegex = new RegExp(query, 'i');

    const alumni = await User.find({
      verificationStatus: VerificationStatus.APPROVED,
      $or: [
        { fullName: searchRegex },
        { email: searchRegex },
        { department: searchRegex },
        { batch: searchRegex },
        { 'workDetails.company': searchRegex },
      ],
    })
      .limit(limit)
      .select({
        fullName: 1,
        profilePicture: 1,
        batch: 1,
        department: 1,
        email: 1,
        role: 1,
        workDetails: 1,
      })
      .lean();

    return successResponse({
      results: alumni.map((alum: any) => ({
        _id: alum._id.toString(),
        fullName: alum.fullName,
        profilePicture: alum.profilePicture,
        batch: alum.batch,
        department: alum.department,
        email: alum.email,
        role: alum.role,
        currentCompany: alum.workDetails?.company || 'Not specified',
        jobTitle: alum.workDetails?.jobTitle || 'Professional',
      })),
      count: alumni.length,
    });
  } catch (error) {
    console.error('Error searching alumni:', error);
    return errorResponse('Failed to search alumni', 500);
  }
}
