import { NextRequest } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import connectToDatabase from '@/lib/db';
import University from '@/models/University';
import { requireAdmin } from '@/lib/admin';
import { successResponse, errorResponse } from '@/lib/apiResponse';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * PUT /api/admin/universities/[id]
 * Admin only - update university
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    const { id } = await params;
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const website = formData.get('website') as string;
    const location = formData.get('location') as string;
    const isActive = formData.get('isActive') === 'true';
    const logoFile = formData.get('logo') as File;

    if (!name || !location) {
      return errorResponse('Name and location are required', 400);
    }

    await connectToDatabase();

    const university = await University.findById(id);
    if (!university) {
      return errorResponse('University not found', 404);
    }

    // Check if another university with same name exists
    const existingUniversity = await University.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: id }
    });

    if (existingUniversity) {
      return errorResponse('University with this name already exists', 409);
    }

    let logoUrl = university.logoUrl;

    // Upload new logo if provided
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
            public_id: `university_${id}_${Date.now()}`,
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

    // Update university
    university.name = name;
    university.website = website;
    university.location = location;
    university.isActive = isActive;
    university.logoUrl = logoUrl;

    await university.save();

    return successResponse({
      id: university._id,
      name: university.name,
      slug: university.slug,
      logoUrl: university.logoUrl,
      website: university.website,
      location: university.location,
      isActive: university.isActive,
    }, 'University updated successfully');
  } catch (error) {
    console.error('Update university error:', error);
    return errorResponse('Internal server error', 500);
  }
}

/**
 * DELETE /api/admin/universities/[id]
 * Admin only - soft delete university
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    const { id } = await params;
    await connectToDatabase();

    const university = await University.findById(id);
    if (!university) {
      return errorResponse('University not found', 404);
    }

    university.isActive = false;
    await university.save();

    return successResponse({ message: 'University deactivated successfully' });
  } catch (error) {
    console.error('Delete university error:', error);
    return errorResponse('Internal server error', 500);
  }
}