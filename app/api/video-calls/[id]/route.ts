import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import VideoCallBooking, { CallStatus } from '@/models/VideoCallBooking';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { verifyAccessToken } from '@/lib/jwt';
function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return verifyAccessToken(token);
}


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decoded = getAuthenticatedUser(request);
    if (!decoded) {
      return errorResponse('Unauthorized', 401);
    }

    await connectToDatabase();

    const booking = await VideoCallBooking.findById(id)
      .populate('alumniId', 'fullName profilePicture email')
      .populate('studentId', 'fullName profilePicture email');

    if (!booking) {
      return errorResponse('Video call booking not found', 404);
    }

    return successResponse(booking, 'Video call booking fetched successfully');
  } catch (error) {
    console.error('Error fetching video call:', error);
    return errorResponse('Failed to fetch video call booking', 500);
  }
}


export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decoded = getAuthenticatedUser(request);
    if (!decoded) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { status, actualStartTime, actualEndTime, recordingUrl, notes } = body;

    await connectToDatabase();

    const booking = await VideoCallBooking.findById(id);

    if (!booking) {
      return errorResponse('Video call booking not found', 404);
    }
    if (status && Object.values(CallStatus).includes(status)) {
      booking.status = status;
    }

    if (actualStartTime) {
      booking.actualStartTime = new Date(actualStartTime);
    }

    if (actualEndTime) {
      booking.actualEndTime = new Date(actualEndTime);
    }

    if (recordingUrl) {
      booking.recordingUrl = recordingUrl;
    }

    if (notes) {
      booking.notes = notes;
    }

    await booking.save();

    await booking.populate('alumniId', 'fullName profilePicture');
    await booking.populate('studentId', 'fullName profilePicture');

    return successResponse(booking, 'Video call booking updated successfully');
  } catch (error) {
    console.error('Error updating video call:', error);
    return errorResponse('Failed to update video call booking', 500);
  }
}


export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decoded = getAuthenticatedUser(request);
    if (!decoded) {
      return errorResponse('Unauthorized', 401);
    }

    await connectToDatabase();

    const booking = await VideoCallBooking.findById(id);

    if (!booking) {
      return errorResponse('Video call booking not found', 404);
    }
    if (booking.status === CallStatus.ONGOING || booking.status === CallStatus.COMPLETED) {
      return errorResponse('Cannot cancel an ongoing or completed call', 400);
    }

    booking.status = CallStatus.CANCELLED;
    await booking.save();

    return successResponse(booking, 'Video call booking cancelled successfully');
  } catch (error) {
    console.error('Error cancelling video call:', error);
    return errorResponse('Failed to cancel video call booking', 500);
  }
}
