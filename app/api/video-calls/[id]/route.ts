import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import VideoCallBooking, { CallStatus } from '@/models/VideoCallBooking';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/admin';

/**
 * GET /api/video-calls/[id]
 * Get a specific video call booking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = requireAuth(request);
    if (authCheck) return authCheck;

    await connectToDatabase();

    const booking = await VideoCallBooking.findById(params.id)
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

/**
 * PATCH /api/video-calls/[id]
 * Update video call booking status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = requireAuth(request);
    if (authCheck) return authCheck;

    const body = await request.json();
    const { status, actualStartTime, actualEndTime, recordingUrl, notes } = body;

    await connectToDatabase();

    const booking = await VideoCallBooking.findById(params.id);

    if (!booking) {
      return errorResponse('Video call booking not found', 404);
    }

    // Update fields
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

/**
 * DELETE /api/video-calls/[id]
 * Cancel a video call booking
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = requireAuth(request);
    if (authCheck) return authCheck;

    await connectToDatabase();

    const booking = await VideoCallBooking.findById(params.id);

    if (!booking) {
      return errorResponse('Video call booking not found', 404);
    }

    // Only allow cancellation if not already started
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
