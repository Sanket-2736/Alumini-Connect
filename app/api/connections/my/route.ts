import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import Connection from '@/models/Connection';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { ConnectionStatus } from '@/models/Connection';
import { successResponse, errorResponse } from '@/lib/apiResponse';

/**
 * GET /api/connections/my
 * Get user's connections with optional status filter
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    await connectToDatabase();

    // Build query based on status
    let query: any = {};

    if (status === 'pending_received') {
      query = {
        recipient: user._id,
        status: ConnectionStatus.PENDING,
      };
    } else if (status === 'pending_sent') {
      query = {
        requester: user._id,
        status: ConnectionStatus.PENDING,
      };
    } else if (status === 'accepted') {
      query = {
        $or: [
          { requester: user._id, status: ConnectionStatus.ACCEPTED },
          { recipient: user._id, status: ConnectionStatus.ACCEPTED },
        ],
      };
    } else {
      // Get all connections for the user
      query = {
        $or: [
          { requester: user._id },
          { recipient: user._id },
        ],
      };
    }

    // Get total count
    const total = await Connection.countDocuments(query);

    // Get connections with pagination
    const connections = await Connection.find(query)
      .populate({
        path: 'requester',
        select: '_id fullName profilePicture university department batch workDetails skills verificationStatus',
        populate: { path: 'university', select: 'name slug' }
      })
      .populate({
        path: 'recipient',
        select: '_id fullName profilePicture university department batch workDetails skills verificationStatus',
        populate: { path: 'university', select: 'name slug' }
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Format response to include the other user in each connection
    const formattedConnections = connections.map(conn => {
      const isRequester = conn.requester._id.toString() === user._id.toString();
      const otherUser = isRequester ? conn.recipient : conn.requester;

      return {
        id: conn._id,
        status: conn.status,
        createdAt: conn.createdAt,
        updatedAt: conn.updatedAt,
        user: otherUser,
        isRequester,
      };
    });

    return successResponse({
      connections: formattedConnections,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get connections error:', error);
    return errorResponse('Internal server error', 500);
  }
}