import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import University from '@/models/University';
import Department from '@/models/Department';
import Batch from '@/models/Batch';
import { successResponse, errorResponse } from '@/lib/apiResponse';

/**
 * GET /api/universities/[slug]
 * Return university with its departments and batches
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectToDatabase();

    const university = await University.findOne({
      slug: slug,
      isActive: true
    });

    if (!university) {
      return errorResponse('University not found', 404);
    }

    // Get departments
    const departments = await Department.find({
      university: university._id,
      isActive: true
    }).select('name').sort({ name: 1 });

    // Get batches
    const batches = await Batch.find({
      university: university._id
    })
    .populate('department', 'name')
    .select('year label department')
    .sort({ year: -1 });

    const result = {
      university: {
        id: university._id,
        name: university.name,
        slug: university.slug,
        logoUrl: university.logoUrl,
        website: university.website,
        location: university.location,
      },
      departments: departments.map(dept => ({
        id: dept._id,
        name: dept.name,
      })),
      batches: batches.map(batch => ({
        id: batch._id,
        year: batch.year,
        label: batch.label,
        department: batch.department ? {
          id: batch.department._id,
          name: batch.department.name,
        } : null,
      })),
    };

    return successResponse(result);
  } catch (error) {
    console.error('Get university detail error:', error);
    return errorResponse('Internal server error', 500);
  }
}