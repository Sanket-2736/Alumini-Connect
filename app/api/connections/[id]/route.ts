import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import Connection from '@/models/Connection';
import { getUserFromRequest } from '@/lib/auth';
import { ConnectionStatus } from '@/models/Connection';
import { successResponse, errorResponse } from '@/lib/apiResponse';

/**
 * DELETE /api/connections/[id]
 * Withdraw pending request or disconnect accepted connection
 */
export async function DELETE(
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
      return errorResponse('Connection not found', 404);
    }

    // Check if user is part of this connection
    const isRequester = connection.requester.toString() === user._id.toString();
    const isRecipient = connection.recipient.toString() === user._id.toString();

    if (!isRequester && !isRecipient) {
      return errorResponse('You are not part of this connection', 403);
    }

    let action = '';

    if (connection.status === ConnectionStatus.PENDING) {
      // Only requester can withdraw pending request
      if (!isRequester) {
        return errorResponse('Only the requester can withdraw a pending request', 403);
      }
      connection.status = ConnectionStatus.WITHDRAWN;
      action = 'withdrawn';
    } else if (connection.status === ConnectionStatus.ACCEPTED) {
      // Either party can disconnect
      connection.status = ConnectionStatus.WITHDRAWN;
      action = 'disconnected';
    } else {
      return errorResponse('Cannot modify this connection', 400);
    }

    await connection.save();

    return successResponse({ message: `Connection ${action} successfully` });
  } catch (error) {
    console.error('Delete connection error:', error);
    return errorResponse('Internal server error', 500);
  }
}