import { NextRequest } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { successResponse, errorResponse } from '@/lib/apiResponse';
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return errorResponse('User not authenticated', 401);
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return errorResponse('No file uploaded', 400);
    }
    if (!file.type.startsWith('image/')) {
      return errorResponse('Only image files are allowed', 400);
    }
    if (file.size > 5 * 1024 * 1024) {
      return errorResponse('File size must be less than 5MB', 400);
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse('User not found', 404);
    }
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'alumni/avatars',
          public_id: `user_${userId}_${Date.now()}`,
          transformation: [
            { width: 300, height: 300, crop: 'fill', gravity: 'face' },
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
    user.profilePicture = (uploadResult as any).secure_url;
    await user.save();

    return successResponse({
      profilePicture: user.profilePicture,
      message: 'Avatar uploaded successfully',
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return errorResponse('Failed to upload avatar', 500);
  }
}