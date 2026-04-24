import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Connection from '@/models/Connection';
import { getUserFromRequest } from '@/lib/auth';
import { ConnectionStatus } from '@/models/Connection';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { createNotification } from '@/lib/services/notificationService';
import { NotificationType } from '@/models/Notification';

/**
 * POST /api/connections/request
 * Send connection request to another user
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const { recipientId } = await request.json();

    if (!recipientId) {
      return errorResponse('Recipient ID is required', 400);
    }

    if (recipientId === user._id.toString()) {
      return errorResponse('Cannot send connection request to yourself', 400);
    }

    await connectToDatabase();

    // Check if recipient exists and is not banned
    const recipient = await User.findOne({ _id: recipientId, isBanned: false });
    if (!recipient) {
      return errorResponse('Recipient not found', 404);
    }

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { requester: user._id, recipient: recipientId },
        { requester: recipientId, recipient: user._id },
      ],
    });

    if (existingConnection) {
      if (existingConnection.status === ConnectionStatus.ACCEPTED) {
        return errorResponse('Already connected to this user', 400);
      }
      if (existingConnection.status === ConnectionStatus.PENDING) {
        return errorResponse('Connection request already exists', 400);
      }
      if (existingConnection.status === ConnectionStatus.REJECTED &&
          existingConnection.recipient.toString() === user._id.toString()) {
        return errorResponse('Cannot send request to user who rejected you', 400);
      }
    }

    // Create new connection request
    const connection = new Connection({
      requester: user._id,
      recipient: recipientId,
      status: ConnectionStatus.PENDING,
    });

    await connection.save();

    // Notify recipient
    await createNotification({
      recipientId,
      type: NotificationType.CONNECTION_REQUEST,
      actorId: user._id.toString(),
      title: 'New connection request',
      body: `${user.fullName} sent you a connection request`,
      link: '/dashboard/connections',
      entityId: connection._id.toString(),
      entityModel: 'Connection',
    });

    // Populate user details for response
    await connection.populate([
      { path: 'requester', select: 'fullName profilePicture' },
      { path: 'recipient', select: 'fullName profilePicture' },
    ]);

    return successResponse(connection, 'Connection request sent successfully', 201);
  } catch (error) {
    console.error('Connection request error:', error);
    return errorResponse('Internal server error', 500);
  }
}