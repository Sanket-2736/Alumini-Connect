import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import Connection from '@/models/Connection';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { ConnectionStatus } from '@/models/Connection';
import { successResponse, errorResponse } from '@/lib/apiResponse';

/**
 * GET /api/connections/status/[userId]
 * Get connection status between current user and specified user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const { userId } = await params;

    if (userId === user._id.toString()) {
      return errorResponse('Cannot check connection status with yourself', 400);
    }

    await connectToDatabase();

    // Check if target user exists
    const targetUser = await User.findOne({ _id: userId, isBanned: false });
    if (!targetUser) {
      return errorResponse('User not found', 404);
    }

    // Find connection between users
    const connection = await Connection.findOne({
      $or: [
        { requester: user._id, recipient: userId },
        { requester: userId, recipient: user._id },
      ],
    });

    let status = 'none';
    let connectionId = null;

    if (connection) {
      connectionId = connection._id;

      if (connection.status === ConnectionStatus.ACCEPTED) {
        status = 'connected';
      } else if (connection.status === ConnectionStatus.PENDING) {
        if (connection.requester.toString() === user._id.toString()) {
          status = 'pending_sent';
        } else {
          status = 'pending_received';
        }
      } else if (connection.status === ConnectionStatus.REJECTED) {
        if (connection.recipient.toString() === user._id.toString()) {
          status = 'rejected';
        } else {
          status = 'none'; // Requester can try again
        }
      } else if (connection.status === ConnectionStatus.WITHDRAWN) {
        status = 'none'; // Can try to connect again
      }
    }

    return successResponse({
      status,
      connectionId,
      user: {
        id: targetUser._id,
        fullName: targetUser.fullName,
        profilePicture: targetUser.profilePicture,
      },
    });
  } catch (error) {
    console.error('Get connection status error:', error);
    return errorResponse('Internal server error', 500);
  }
}