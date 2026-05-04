import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import University from '@/models/University';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { requireAdmin } from '@/lib/admin';

/**
 * PATCH /api/admin/universities/[id]
 * Update a university
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin access
  const adminCheck = requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid university ID', 400);
    }

    const body = await request.json();
    await connectToDatabase();

    const university = await University.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );

    if (!university) {
      return errorResponse('University not found', 404);
    }

    return successResponse(university, 'University updated successfully');
  } catch (error) {
    console.error('Error updating university:', error);
    return errorResponse('Failed to update university', 500);
  }
}

/**
 * DELETE /api/admin/universities/[id]
 * Delete a university
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin access
  const adminCheck = requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid university ID', 400);
    }

    await connectToDatabase();

    const university = await University.findByIdAndDelete(id);

    if (!university) {
      return errorResponse('University not found', 404);
    }

    return successResponse(null, 'University deleted successfully');
  } catch (error) {
    console.error('Error deleting university:', error);
    return errorResponse('Failed to delete university', 500);
  }
}
