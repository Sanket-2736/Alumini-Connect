import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file to Cloudinary
 * @param file - File data (base64 or buffer)
 * @param folder - Folder path in Cloudinary
 * @param publicId - Optional public ID for the file
 */
export async function uploadToCloudinary(
  file: Buffer | string,
  folder: string,
  publicId?: string
): Promise<string> {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result?.secure_url) {
            resolve(result.secure_url);
          } else {
            reject(new Error('Upload failed: No URL returned'));
          }
        }
      );

      if (typeof file === 'string') {
        uploadStream.end(Buffer.from(file, 'base64'));
      } else {
        uploadStream.end(file);
      }
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

/**
 * Delete a file from Cloudinary
 * @param publicId - Public ID of the file to delete (including folder path)
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
}

/**
 * Extract public ID from Cloudinary URL
 * @param url - Cloudinary URL
 */
export function getPublicIdFromUrl(url: string): string {
  try {
    const matches = url.match(/\/(?:v\d+\/)?([^/?]+\/)([a-zA-Z0-9_-]+)(?:\.[a-z]+)?(?:\?.*)?$/);
    if (matches) {
      return `${matches[1]}${matches[2]}`;
    }
    return url;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return url;
  }
}
