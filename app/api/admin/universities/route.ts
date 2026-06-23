import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import University from '@/models/University';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { requireAdmin } from '@/lib/admin';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { z } from 'zod';

const createUniversitySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  location: z.string().min(2, 'Location must be at least 2 characters'),
  state: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  yearEstablished: z.number().min(1800).max(new Date().getFullYear()).optional(),
  description: z.string().max(1000).optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  totalStudents: z.number().min(0).optional(),
  totalAlumni: z.number().min(0).optional(),
});


export async function GET(request: NextRequest) {
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


export async function POST(request: NextRequest) {
  const adminCheck = requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    const formData = await request.formData();
    const rawData = {
      name: formData.get('name') as string,
      location: formData.get('location') as string,
      state: (formData.get('state') as string) || undefined,
      website: (formData.get('website') as string) || undefined,
      yearEstablished: formData.get('yearEstablished')
        ? parseInt(formData.get('yearEstablished') as string)
        : undefined,
      description: (formData.get('description') as string) || undefined,
      contactEmail: (formData.get('contactEmail') as string) || undefined,
      contactPhone: (formData.get('contactPhone') as string) || undefined,
      totalStudents: formData.get('totalStudents')
        ? parseInt(formData.get('totalStudents') as string)
        : undefined,
      totalAlumni: formData.get('totalAlumni')
        ? parseInt(formData.get('totalAlumni') as string)
        : undefined,
    };

    const validatedData = createUniversitySchema.parse(rawData);

    await connectToDatabase();
    const slug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const existingUniversity = await University.findOne({ slug });
    if (existingUniversity) {
      return errorResponse('University with this name already exists', 409);
    }
    let logoUrl: string | undefined;
    const logoFile = formData.get('logo') as File | null;
    if (logoFile && logoFile.size > 0) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(logoFile.type)) {
        return errorResponse('Invalid logo format. Only JPG, PNG, WebP, and SVG are allowed', 400);
      }
      if (logoFile.size > 2 * 1024 * 1024) {
        return errorResponse('Logo file is too large. Maximum size is 2MB', 400);
      }

      const buffer = Buffer.from(await logoFile.arrayBuffer());
      logoUrl = await uploadToCloudinary(buffer, 'university-logos', `logo-${slug}`);
    }

    const university = new University({
      ...validatedData,
      slug,
      logoUrl,
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
