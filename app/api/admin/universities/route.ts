import { NextRequest } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import connectToDatabase from '@/lib/db';
import University from '@/models/University';
import Department from '@/models/Department';
import Batch from '@/models/Batch';
import { requireAdmin } from '@/lib/admin';
import { successResponse, errorResponse } from '@/lib/apiResponse';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * GET /api/admin/universities
 * Admin only - get all universities with stats
 */
export async function GET(request: NextRequest) {
  const adminCheck = requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    await connectToDatabase();

    const universities = await University.find({})
      .sort({ createdAt: -1 });

    // Get department and batch counts for each university
    const universitiesWithStats = await Promise.all(
      universities.map(async (university) => {
        const departmentCount = await Department.countDocuments({
          university: university._id,
          isActive: true
        });

        const batchCount = await Batch.countDocuments({
          university: university._id
        });

        return {
          id: university._id,
          name: university.name,
          slug: university.slug,
          logoUrl: university.logoUrl,
          website: university.website,
          location: university.location,
          isActive: university.isActive,
          departmentCount,
          batchCount,
          createdAt: university.createdAt,
        };
      })
    );

    return successResponse(universitiesWithStats);
  } catch (error) {
    console.error('Get admin universities error:', error);
    return errorResponse('Internal server error', 500);
  }
}

/**
 * POST /api/admin/universities
 * Admin only - create new university with logo upload
 */
export async function POST(request: NextRequest) {
  const adminCheck = requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const website = formData.get('website') as string;
    const location = formData.get('location') as string;
    const logoFile = formData.get('logo') as File;

    if (!name || !location) {
      return errorResponse('Name and location are required', 400);
    }

    await connectToDatabase();

    // Check if university with same name exists
    const existingUniversity = await University.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingUniversity) {
      return errorResponse('University with this name already exists', 409);
    }

    let logoUrl: string | undefined;

    // Upload logo if provided
    if (logoFile) {
      if (!logoFile.type.startsWith('image/')) {
        return errorResponse('Only image files are allowed for logo', 400);
      }

      const bytes = await logoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'universities/logos',
            public_id: `university_${Date.now()}`,
            transformation: [
              { width: 200, height: 200, crop: 'fill' },
              { quality: 'auto' },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        uploadStream.end(buffer);
      });

      logoUrl = (uploadResult as any).secure_url;
    }

    // Create university
    const university = new University({
      name,
      website,
      location,
      logoUrl,
    });

    await university.save();

    return successResponse({
      id: university._id,
      name: university.name,
      slug: university.slug,
      logoUrl: university.logoUrl,
      website: university.website,
      location: university.location,
      isActive: university.isActive,
    }, 'University created successfully', 201);
  } catch (error) {
    console.error('Create university error:', error);
    return errorResponse('Internal server error', 500);
  }
}