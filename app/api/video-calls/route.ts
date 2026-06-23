import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import VideoCallBooking, { CallStatus } from '@/models/VideoCallBooking';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { verifyAccessToken } from '@/lib/jwt';
import { v4 as uuidv4 } from 'uuid';
function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return verifyAccessToken(token);
}


export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthenticatedUser(request);
    if (!decoded) {
      return errorResponse('Unauthorized', 401);
    }

    const userId = decoded.userId;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const role = searchParams.get('role'); // 'alumni' or 'student'

    await connectToDatabase();

    let query: any = {};

    if (role === 'alumni') {
      query.alumniId = userId;
    } else if (role === 'student') {
      query.studentId = userId;
    } else {
      query = {
        $or: [
          { alumniId: userId },
          { studentId: userId },
        ],
      };
    }

    if (status) {
      query.status = status;
    }

    const bookings = await VideoCallBooking.find(query)
      .populate('alumniId', 'fullName profilePicture')
      .populate('studentId', 'fullName profilePicture')
      .sort({ scheduledStartTime: -1 });

    return successResponse(bookings, 'Video call bookings fetched successfully');
  } catch (error) {
    console.error('Error fetching video calls:', error);
    return errorResponse('Failed to fetch video calls', 500);
  }
}


export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthenticatedUser(request);
    if (!decoded) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { alumniId, studentId, scheduledStartTime, scheduledEndTime, title, description } = body;

    if (!alumniId || !studentId || !scheduledStartTime || !scheduledEndTime || !title) {
      return errorResponse('Missing required fields', 400);
    }
    const startTime = new Date(scheduledStartTime);
    const endTime = new Date(scheduledEndTime);

    if (startTime >= endTime) {
      return errorResponse('Start time must be before end time', 400);
    }

    if (startTime < new Date()) {
      return errorResponse('Start time must be in the future', 400);
    }

    await connectToDatabase();

    const sessionId = `call-${uuidv4()}`;

    const booking = new VideoCallBooking({
      alumniId,
      studentId,
      scheduledStartTime: startTime,
      scheduledEndTime: endTime,
      title,
      description,
      sessionId,
      status: CallStatus.SCHEDULED,
    });

    await booking.save();
    await booking.populate('alumniId', 'fullName profilePicture');
    await booking.populate('studentId', 'fullName profilePicture');

    return successResponse(booking, 'Video call booking created successfully', 201);
  } catch (error) {
    console.error('Error creating video call:', error);
    return errorResponse('Failed to create video call booking', 500);
  }
}
