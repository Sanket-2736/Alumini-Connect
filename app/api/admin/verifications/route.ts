import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import University from '@/models/University';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { requireAdmin } from '@/lib/admin';

/**
 * GET /api/admin/verifications
 * Get all pending user verifications
 */
export async function GET(request: NextRequest) {
  // Check admin access
  const adminCheck = requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    await connectToDatabase();

    // Get all users (including approved, rejected, pending, and not_submitted)
    // This allows admin to view documents for any user
    const users = await User.find({})
      .select('_id fullName email university department batch role verificationDocs verificationStatus createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Get university names
    const universityIds = [...new Set(users.map(u => u.university.toString()))];
    const universities = await University.find({ _id: { $in: universityIds } })
      .select('_id name')
      .lean();

    const universityMap = new Map(universities.map(u => [u._id.toString(), u.name]));

    // Format response
    const verifications = users.map((user) => ({
      userId: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      university: universityMap.get(user.university.toString()) || 'Unknown',
      department: user.department,
      batch: user.batch,
      role: user.role,
      verificationDocs: user.verificationDocs,
      verificationStatus: user.verificationStatus,
      createdAt: user.createdAt,
    }));

    return successResponse(verifications, 'Verifications fetched successfully');
  } catch (error) {
    console.error('Error fetching verifications:', error);
    return errorResponse('Failed to fetch verifications', 500);
  }
}
