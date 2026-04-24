import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

/**
 * Get authenticated user from request headers
 * Headers are set by middleware
 */
export async function getUserFromRequest(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return null;
  }

  await connectToDatabase();
  const user = await User.findById(userId).select('-passwordHash -refreshTokens');
  return user;
}