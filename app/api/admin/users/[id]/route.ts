import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { requireAdmin } from '@/lib/admin';
import { deleteFromCloudinary, getPublicIdFromUrl } from '@/lib/cloudinary';
import { VerificationStatus } from '@/lib/enums';


export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid user ID', 400);
    }

    const body = await request.json();
    await connectToDatabase();
    const user = await User.findById(id);
    if (!user) {
      return errorResponse('User not found', 404);
    }
    if (body.action === 'verify') {
      if (user.verificationStatus !== VerificationStatus.PENDING) {
        return errorResponse('User is not pending verification', 400);
      }
      user.verificationStatus = VerificationStatus.APPROVED;
      user.rejectionReason = undefined;
      await user.save();
      return successResponse(user, 'User verified successfully');
    }

    if (body.action === 'reject') {
      if (user.verificationStatus !== VerificationStatus.PENDING) {
        return errorResponse('User is not pending verification', 400);
      }
      if (!body.reason) {
        return errorResponse('Rejection reason is required', 400);
      }
      user.verificationStatus = VerificationStatus.REJECTED;
      user.rejectionReason = body.reason;
      await user.save();
      return successResponse(user, 'User rejected successfully');
    }
    const allowedUpdates = ['isBanned'];
    const updates: any = {};

    for (const key of allowedUpdates) {
      if (key in body) {
        updates[key] = body[key];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('_id fullName email role verificationStatus isBanned');

    return successResponse(updatedUser, 'User updated successfully');
  } catch (error) {
    console.error('Error updating user:', error);
    return errorResponse('Failed to update user', 500);
  }
}


export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid user ID', 400);
    }

    await connectToDatabase();

    const user = await User.findById(id);
    if (!user) {
      return errorResponse('User not found', 404);
    }
    if (user.verificationDocs && user.verificationDocs.length > 0) {
      try {
        for (const docUrl of user.verificationDocs) {
          const publicId = getPublicIdFromUrl(docUrl);
          await deleteFromCloudinary(publicId);
        }
      } catch (error) {
        console.error('Error deleting documents from Cloudinary:', error);
      }
    }
    if (user.profilePicture) {
      try {
        const publicId = getPublicIdFromUrl(user.profilePicture);
        await deleteFromCloudinary(publicId);
      } catch (error) {
        console.error('Error deleting profile picture from Cloudinary:', error);
      }
    }
    await User.findByIdAndDelete(id);

    return successResponse({ userId: id }, 'User deleted successfully');
  } catch (error) {
    console.error('Error deleting user:', error);
    return errorResponse('Failed to delete user', 500);
  }
}
