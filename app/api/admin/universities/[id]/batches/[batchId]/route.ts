import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import Batch from '@/models/Batch';
import { requireAdmin } from '@/lib/admin';
import { successResponse, errorResponse } from '@/lib/apiResponse';

/**
 * PUT /api/admin/universities/[id]/batches/[batchId]
 * Admin only - update batch
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; batchId: string }> }
) {
  const adminCheck = requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    const { id, batchId } = await params;
    const { year, label, departmentId, isActive } = await request.json();

    if (!year || !label || !label.trim()) {
      return errorResponse('Year and label are required', 400);
    }

    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear();
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear + 10) {
      return errorResponse('Invalid year format', 400);
    }

    await connectToDatabase();

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return errorResponse('Batch not found', 404);
    }

    if (batch.university.toString() !== id) {
      return errorResponse('Batch does not belong to this university', 400);
    }

    if (departmentId) {
      const Department = (await import('@/models/Department')).default;
      const department = await Department.findOne({
        _id: departmentId,
        university: id,
        isActive: true,
      });
      if (!department) {
        return errorResponse('Department not found or does not belong to this university', 404);
      }
    }

    const existingBatch = await Batch.findOne({
      university: id,
      year: yearNum,
      label: { $regex: new RegExp(`^${label.trim()}$`, 'i') },
      _id: { $ne: batchId },
      ...(departmentId && { department: departmentId }),
    });

    if (existingBatch) {
      return errorResponse('Batch with this year and label already exists', 409);
    }

    batch.year = yearNum;
    batch.label = label.trim();
    batch.department = departmentId || null;
    if (isActive !== undefined) batch.isActive = isActive;

    await batch.save();
    await batch.populate('university', 'name slug');
    if (departmentId) await batch.populate('department', 'name');

    return successResponse(batch, 'Batch updated successfully');
  } catch (error) {
    console.error('Update batch error:', error);
    return errorResponse('Internal server error', 500);
  }
}

/**
 * DELETE /api/admin/universities/[id]/batches/[batchId]
 * Admin only - soft delete batch
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; batchId: string }> }
) {
  const adminCheck = requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    const { id, batchId } = await params;
    await connectToDatabase();

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return errorResponse('Batch not found', 404);
    }

    if (batch.university.toString() !== id) {
      return errorResponse('Batch does not belong to this university', 400);
    }

    batch.isActive = false;
    await batch.save();

    return successResponse({ message: 'Batch deactivated successfully' });
  } catch (error) {
    console.error('Delete batch error:', error);
    return errorResponse('Internal server error', 500);
  }
}
