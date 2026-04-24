import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import Connection from '@/models/Connection';
import { getUserFromRequest } from '@/lib/auth';
import { ConnectionStatus } from '@/models/Connection';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { createNotification } from '@/lib/services/notificationService';
import { NotificationType } from '@/models/Notification';

/**
 * PUT /api/connections/[id]/accept
 * Accept a connection request
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

    if (connection.recipient.toString() !== user._id.toString()) {
      return errorResponse('You can only accept requests sent to you', 403);
    }

    if (connection.status === ConnectionStatus.ACCEPTED) {
      return errorResponse('Connection request already accepted', 400);
    }

    if (connection.status !== ConnectionStatus.PENDING) {
      return errorResponse('Connection request is not pending', 400);
    }

    connection.status = ConnectionStatus.ACCEPTED;
    await connection.save();

    // Notify requester
    await createNotification({
      recipientId: connection.requester.toString(),
      type: NotificationType.CONNECTION_ACCEPTED,
      actorId: user._id.toString(),
      title: 'Connection request accepted',
      body: `${user.fullName} accepted your connection request`,
      link: `/dashboard/profile/${user._id}`,
      entityId: connection._id.toString(),
      entityModel: 'Connection',
    });

    await connection.populate([
      { path: 'requester', select: 'fullName profilePicture' },
      { path: 'recipient', select: 'fullName profilePicture' },
    ]);

    return successResponse(connection, 'Connection request accepted');
  } catch (error) {
    console.error('Accept connection error:', error);
    return errorResponse('Internal server error', 500);
  }
}