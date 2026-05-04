import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { registerSchema } from '@/lib/validations';
import { VerificationStatus } from '@/lib/enums';
import { uploadToCloudinary } from '@/lib/cloudinary';

/**
 * POST /api/auth/register
 * Register a new user with document upload
 * Body: FormData with registration fields + documents
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract registration data
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const university = formData.get('university') as string;
    const department = formData.get('department') as string;
    const batch = formData.get('batch') as string;
    const role = formData.get('role') as string;
    const userType = formData.get('userType') as string; // 'student' or 'alumni'
    const documents = formData.getAll('documents') as File[];

    // Validate registration data
    const validatedData = registerSchema.parse({
      fullName,
      email,
      password,
      university,
      department,
      batch,
      role,
    });

    // Validate documents
    if (!documents || documents.length === 0) {
      return errorResponse('At least one verification document is required', 400);
    }

    if (!['student', 'alumni'].includes(userType)) {
      return errorResponse('Invalid user type. Must be student or alumni', 400);
    }

    // Validate file types (PDF, JPG, PNG only)
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    for (const file of documents) {
      if (!allowedMimeTypes.includes(file.type)) {
        return errorResponse(`Invalid file type: ${file.name}. Only PDF, JPG, and PNG are allowed`, 400);
      }

      // Validate file size (max 5MB per file)
      if (file.size > 5 * 1024 * 1024) {
        return errorResponse(`File ${file.name} is too large. Maximum size is 5MB`, 400);
      }
    }

    // Connect to database
    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return errorResponse('User with this email already exists', 409);
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(validatedData.password, saltRounds);

    // Create user first
    const user = new User({
      fullName: validatedData.fullName,
      email: validatedData.email,
      passwordHash,
      role: validatedData.role,
      university: new mongoose.Types.ObjectId(validatedData.university),
      department: validatedData.department,
      batch: validatedData.batch,
      skills: [],
      verificationDocs: [],
      verificationStatus: VerificationStatus.NOT_SUBMITTED,
      refreshTokens: [],
    });

    await user.save();

    // Upload files to Cloudinary
    const uploadedUrls: string[] = [];
    try {
      for (const file of documents) {
        const buffer = await file.arrayBuffer();
        const buffer_typed = new Uint8Array(buffer);
        const url = await uploadToCloudinary(
          Buffer.from(buffer_typed),
          `alumni-verification/${user._id}`,
          `${userType}-doc-${Date.now()}`
        );
        uploadedUrls.push(url);
      }
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      // Delete user if upload fails
      await User.findByIdAndDelete(user._id);
      return errorResponse('Failed to upload documents', 500);
    }

    // Update user with uploaded documents and set status to PENDING
    user.verificationDocs = uploadedUrls;
    user.verificationStatus = VerificationStatus.PENDING;
    await user.save();

    return successResponse(
      { userId: user._id, verificationStatus: user.verificationStatus },
      'Registration successful! Your documents are pending admin verification. You will be able to sign in once approved.',
      201
    );
  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof z.ZodError) {
      return errorResponse('Validation failed', 400, error.issues);
    }

    return errorResponse('Internal server error', 500);
  }
}