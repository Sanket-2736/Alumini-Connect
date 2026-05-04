import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import University from '@/models/University';
import { successResponse, errorResponse } from '@/lib/apiResponse';

/**
 * GET /api/universities
 * Fetch all active universities
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const universities = await University.find({ isActive: true })
      .select('_id name location')
      .sort({ name: 1 });

    return successResponse(universities, 'Universities fetched successfully');
  } catch (error) {
    console.error('Error fetching universities:', error);
    return errorResponse('Failed to fetch universities', 500);
  }
}
