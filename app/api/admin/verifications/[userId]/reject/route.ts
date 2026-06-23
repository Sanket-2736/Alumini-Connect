import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { requireAdmin } from '@/lib/admin';
import { VerificationStatus } from '@/lib/enums';


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const adminCheck = requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    const { userId } = await params;
    const { reason } = await request.json();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return errorResponse('Invalid user ID', 400);
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return errorResponse('Rejection reason is required', 400);
    }

    await connectToDatabase();

    const user = await User.findByIdAndUpdate(
      userId,
      {
        verificationStatus: VerificationStatus.REJECTED,
        rejectionReason: reason.trim(),
      },
      { new: true }
    ).select('_id fullName email verificationStatus rejectionReason');

    if (!user) {
      return errorResponse('User not found', 404);
    }

    console.log(`❌ User ${user.email} rejected by admin. Reason: ${reason}`);

    return successResponse(
      {
        userId: user._id,
        verificationStatus: user.verificationStatus,
        rejectionReason: user.rejectionReason,
      },
      'User verification rejected successfully'
    );
  } catch (error) {
    console.error('Error rejecting verification:', error);
    return errorResponse('Failed to reject verification', 500);
  }
}
