import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Connection from '@/models/Connection';
import { ConnectionStatus } from '@/models/Connection';
import { successResponse, errorResponse } from '@/lib/apiResponse';

/**
 * GET /api/connections/search
 * Search for connected users (both alumni and students)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = request.headers.get('x-user-id');
    const q = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    if (!q.trim()) {
      return successResponse([], 'No search query provided');
    }

    await connectToDatabase();

    // Find all accepted connections for the user
    const connections = await Connection.find({
      $or: [
        { requester: userId, status: ConnectionStatus.ACCEPTED },
        { recipient: userId, status: ConnectionStatus.ACCEPTED },
      ],
    }).select('requester recipient');

    // Get all connected user IDs
    const connectedUserIds = connections.map(conn =>
      conn.requester.toString() === userId ? conn.recipient : conn.requester
    );

    // Search for connected users matching the query
    const searchQuery = q.trim();
    const users = await User.find({
      _id: { $in: connectedUserIds },
      $or: [
        { fullName: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
      ],
    })
      .select('_id fullName profilePicture department batch role')
      .limit(limit)
      .lean();

    return successResponse(users, 'Connected users found');
  } catch (error) {
    console.error('Error searching connected users:', error);
    return errorResponse('Failed to search connected users', 500);
  }
}
