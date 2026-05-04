import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import University from '@/models/University';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { requireAdmin } from '@/lib/admin';

/**
 * GET /api/admin/stats
 * Get platform statistics
 */
export async function GET(request: NextRequest) {
  // Check admin access
  const adminCheck = requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    await connectToDatabase();

    const [
      totalUsers,
      totalUniversities,
      verifiedUsers,
      pendingVerifications,
      bannedUsers,
      activeUsers,
      studentCount,
      alumniCount,
      totalConnections,
      totalMessages,
      totalGroups,
      totalPosts,
      totalJobs,
    ] = await Promise.all([
      User.countDocuments(),
      University.countDocuments(),
      User.countDocuments({ verificationStatus: 'approved' }),
      User.countDocuments({ verificationStatus: 'pending' }),
      User.countDocuments({ isBanned: true }),
      User.countDocuments({ isBanned: false }),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'alumni' }),
      // These would need actual models - using 0 for now
      Promise.resolve(0), // totalConnections
      Promise.resolve(0), // totalMessages
      Promise.resolve(0), // totalGroups
      Promise.resolve(0), // totalPosts
      Promise.resolve(0), // totalJobs
    ]);

    const stats = {
      totalUsers,
      totalUniversities,
      totalPosts,
      totalJobs,
      verifiedUsers,
      pendingVerifications,
      bannedUsers,
      activeUsers,
      studentCount,
      alumniCount,
      totalConnections,
      totalMessages,
      totalGroups,
      usersByUniversity: [],
      usersByVerificationStatus: [],
    };

    return successResponse(stats, 'Statistics fetched successfully');
  } catch (error) {
    console.error('Error fetching stats:', error);
    return errorResponse('Failed to fetch statistics', 500);
  }
}
