import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import Connection from '@/models/Connection';
import { getUserFromRequest } from '@/lib/auth';
import { ConnectionStatus } from '@/models/Connection';
import { successResponse, errorResponse } from '@/lib/apiResponse';

/**
 * PUT /api/connections/[id]/reject
 * Reject a connection request
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await params;

    await connectToDatabase();

    const connection = await Connection.findById(id);
    if (!connection) {
      return errorResponse('Connection request not found', 404);
    }

    // Only recipient can reject
    if (connection.recipient.toString() !== user._id.toString()) {
      return errorResponse('You can only reject requests sent to you', 403);
    }

    // Check if already rejected
    if (connection.status === ConnectionStatus.REJECTED) {
      return errorResponse('Connection request already rejected', 400);
    }

    // Check if pending
    if (connection.status !== ConnectionStatus.PENDING) {
      return errorResponse('Connection request is not pending', 400);
    }

    // Reject the connection
    connection.status = ConnectionStatus.REJECTED;
    await connection.save();

    // Populate user details for response
    await connection.populate([
      { path: 'requester', select: 'fullName profilePicture' },
      { path: 'recipient', select: 'fullName profilePicture' },
    ]);

    return successResponse(connection, 'Connection request rejected');
  } catch (error) {
    console.error('Reject connection error:', error);
    return errorResponse('Internal server error', 500);
  }
}