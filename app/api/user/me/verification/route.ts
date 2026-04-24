import { NextRequest } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { VerificationStatus } from '@/lib/enums';
import { successResponse, errorResponse } from '@/lib/apiResponse';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * PUT /api/user/me/verification
 * Authenticated user uploads verification documents
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    // Check if user can submit verification
    if (user.verificationStatus === VerificationStatus.APPROVED) {
      return errorResponse('Your account is already verified', 400);
    }

    const formData = await request.formData();
    const files = formData.getAll('documents') as File[];

    if (!files || files.length === 0) {
      return errorResponse('At least one document is required', 400);
    }

    if (files.length > 3) {
      return errorResponse('Maximum 3 documents allowed', 400);
    }

    await connectToDatabase();

    // Validate files
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        return errorResponse(`Invalid file type: ${file.name}. Only PDF, JPG, PNG allowed`, 400);
      }
      if (file.size > maxSize) {
        return errorResponse(`File too large: ${file.name}. Maximum 5MB allowed`, 400);
      }
    }

    // Upload files to Cloudinary
    const uploadPromises = files.map(async (file, index) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      return new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `alumni/verification-docs/${user._id}`,
            public_id: `doc_${index + 1}_${Date.now()}`,
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result!.secure_url);
          }
        );

        uploadStream.end(buffer);
      });
    });

    const uploadedUrls = await Promise.all(uploadPromises);

    // Update user with new documents and status
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        verificationDocs: uploadedUrls,
        verificationStatus: VerificationStatus.PENDING,
        rejectionReason: undefined, // Clear any previous rejection reason
      },
      { new: true }
    ).populate('university', 'name slug');

    if (!updatedUser) {
      return errorResponse('User not found', 404);
    }

    return successResponse({
      id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      verificationStatus: updatedUser.verificationStatus,
      verificationDocs: updatedUser.verificationDocs,
      university: updatedUser.university,
      department: updatedUser.department,
      batch: updatedUser.batch,
    }, 'Verification documents submitted successfully');
  } catch (error) {
    console.error('Verification submission error:', error);
    return errorResponse('Internal server error', 500);
  }
}