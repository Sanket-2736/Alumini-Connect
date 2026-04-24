import connectToDatabase from '@/lib/db';
import University from '@/models/University';
import { successResponse, errorResponse } from '@/lib/apiResponse';

/**
 * GET /api/universities
 * Public route - return all active universities for signup dropdown
 */
export async function GET() {
  try {
    await connectToDatabase();

    const universities = await University.find({ isActive: true })
      .select('name slug logoUrl')
      .sort({ name: 1 });

    return successResponse(universities);
  } catch (error) {
    console.error('Get universities error:', error);
    return errorResponse('Internal server error', 500);
  }
}