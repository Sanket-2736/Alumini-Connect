import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import University from '@/models/University';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { requireAdmin } from '@/lib/admin';
import { z } from 'zod';

const createUniversitySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  location: z.string().min(2, 'Location must be at least 2 characters'),
  website: z.string().url().optional().or(z.literal('')),
});

/**
 * GET /api/admin/universities
 * Get all universities (admin view)
 */
export async function GET(request: NextRequest) {
  // Check admin access
  const adminCheck = requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    await connectToDatabase();

    const universities = await University.find()
      .sort({ name: 1 });

    return successResponse(universities, 'Universities fetched successfully');
  } catch (error) {
    console.error('Error fetching universities:', error);
    return errorResponse('Failed to fetch universities', 500);
  }
}

/**
 * POST /api/admin/universities
 * Create a new university
 */
export async function POST(request: NextRequest) {
  // Check admin access
  const adminCheck = requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    const body = await request.json();
    const validatedData = createUniversitySchema.parse(body);

    await connectToDatabase();

    // Generate slug from name
    const slug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if university already exists
    const existingUniversity = await University.findOne({ slug });

    if (existingUniversity) {
      return errorResponse('University with this name already exists', 409);
    }

    const university = new University({
      name: validatedData.name,
      slug: slug, // ✅ Add slug to the university document
      location: validatedData.location,
      website: validatedData.website || undefined,
      isActive: true,
    });

    await university.save();

    return successResponse(university, 'University created successfully', 201);
  } catch (error) {
    console.error('Error creating university:', error);

    if (error instanceof z.ZodError) {
      return errorResponse('Validation failed', 400, error.issues);
    }

    return errorResponse('Failed to create university', 500);
  }
}
