import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import Connection from '@/models/Connection';
import { ConnectionStatus } from '@/models/Connection';
import { successResponse, errorResponse } from '@/lib/apiResponse';

/**
 * GET /api/connections/count/[userId]
 * Get the number of accepted connections for a user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    await connectToDatabase();

    // Count accepted connections where user is either requester or recipient
    const count = await Connection.countDocuments({
      $or: [
        { requester: userId, status: ConnectionStatus.ACCEPTED },
        { recipient: userId, status: ConnectionStatus.ACCEPTED },
      ],
    });

    return successResponse({ count }, 'Connection count retrieved successfully');
  } catch (error) {
    console.error('Error getting connection count:', error);
    return errorResponse('Failed to get connection count', 500);
  }
}
