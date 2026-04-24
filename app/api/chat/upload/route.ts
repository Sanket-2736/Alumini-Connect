import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import mime from 'mime-types';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 20MB limit' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Determine file type category
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const fileType = isImage ? 'image' : 'document';

    // Create temporary file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempFilePath = join(tmpdir(), `upload_${Date.now()}_${file.name}`);
    await writeFile(tempFilePath, buffer);

    // Optional conversationId for folder organisation
    const conversationId = formData.get('conversationId') as string | null;
    const folder = conversationId ? `alumni/chat/${conversationId}` : 'alumni/chat';

    try {
      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(tempFilePath, {
        folder,
        resource_type: isImage ? 'image' : 'raw',
        public_id: `${Date.now()}_${file.name}`,
        transformation: isImage ? [
          { width: 1200, height: 1200, crop: 'limit' }, // Max dimensions for images
          { quality: 'auto' }
        ] : undefined
      });

      // Clean up temp file
      await unlink(tempFilePath);

      return NextResponse.json({
        url: uploadResult.secure_url,
        type: fileType,
        fileName: file.name,
        fileSize: file.size
      });

    } catch (uploadError) {
      // Clean up temp file on error
      await unlink(tempFilePath);
      throw uploadError;
    }

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}