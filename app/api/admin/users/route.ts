import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import University from '@/models/University';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { requireAdmin } from '@/lib/admin';

/**
 * GET /api/admin/users
 * Get all users with optional filtering
 */
export async function GET(request: NextRequest) {
  // Check admin access
  const adminCheck = requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';

    await connectToDatabase();

    let query: any = {};

    switch (filter) {
      case 'pending':
        query.verificationStatus = 'pending';
        break;
      case 'verified':
        query.verificationStatus = 'approved';
        break;
      case 'banned':
        query.isBanned = true;
        break;
      case 'all':
      default:
        break;
    }

    const users = await User.find(query)
      .select('_id fullName email role university verificationStatus isBanned createdAt')
      .populate('university', 'name')
      .sort({ createdAt: -1 });

    return successResponse(users, 'Users fetched successfully');
  } catch (error) {
    console.error('Error fetching users:', error);
    return errorResponse('Failed to fetch users', 500);
  }
}
