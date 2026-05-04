import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { requireAdmin } from '@/lib/admin';

/**
 * GET /api/admin/users/[id]/documents
 * Get user's verification documents (visible to admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin access
  const adminCheck = requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid user ID', 400);
    }

    await connectToDatabase();

    const user = await User.findById(id).select(
      '_id fullName email role verificationStatus verificationDocs rejectionReason createdAt'
    );

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse(
      {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          verificationStatus: user.verificationStatus,
          rejectionReason: user.rejectionReason,
          createdAt: user.createdAt,
        },
        documents: user.verificationDocs || [],
      },
      'User documents retrieved successfully'
    );
  } catch (error) {
    console.error('Error fetching user documents:', error);
    return errorResponse('Failed to fetch user documents', 500);
  }
}
