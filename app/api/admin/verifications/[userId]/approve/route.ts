import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { requireAdmin } from '@/lib/admin';
import { VerificationStatus } from '@/lib/enums';

/**
 * POST /api/admin/verifications/[userId]/approve
 * Approve a user's verification documents
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  // Check admin access
  const adminCheck = requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    const { userId } = await params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return errorResponse('Invalid user ID', 400);
    }

    await connectToDatabase();

    const user = await User.findByIdAndUpdate(
      userId,
      {
        verificationStatus: VerificationStatus.APPROVED,
        rejectionReason: null,
      },
      { new: true }
    ).select('_id fullName email verificationStatus');

    if (!user) {
      return errorResponse('User not found', 404);
    }

    console.log(`✅ User ${user.email} approved by admin`);

    return successResponse(
      { userId: user._id, verificationStatus: user.verificationStatus },
      'User verification approved successfully'
    );
  } catch (error) {
    console.error('Error approving verification:', error);
    return errorResponse('Failed to approve verification', 500);
  }
}
