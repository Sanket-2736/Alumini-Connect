import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import Department from '@/models/Department';
import Batch from '@/models/Batch';
import { requireAdmin } from '@/lib/admin';
import { successResponse, errorResponse } from '@/lib/apiResponse';

/**
 * PUT /api/admin/universities/[id]/departments/[deptId]
 * Admin only - update department
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deptId: string }> }
) {
  const adminCheck = requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    const { id, deptId } = await params;
    const { name, description, isActive } = await request.json();

    if (!name || !name.trim()) {
      return errorResponse('Department name is required', 400);
    }

    await connectToDatabase();

    const department = await Department.findById(deptId);
    if (!department) {
      return errorResponse('Department not found', 404);
    }

    if (department.university.toString() !== id) {
      return errorResponse('Department does not belong to this university', 400);
    }

    const existingDepartment = await Department.findOne({
      university: id,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      _id: { $ne: deptId },
      isActive: true,
    });

    if (existingDepartment) {
      return errorResponse('Department with this name already exists in this university', 409);
    }

    department.name = name.trim();
    if (description !== undefined) department.description = description?.trim() || '';
    if (isActive !== undefined) department.isActive = isActive;

    await department.save();
    await department.populate('university', 'name slug');

    return successResponse(department, 'Department updated successfully');
  } catch (error) {
    console.error('Update department error:', error);
    return errorResponse('Internal server error', 500);
  }
}

/**
 * DELETE /api/admin/universities/[id]/departments/[deptId]
 * Admin only - soft delete department
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deptId: string }> }
) {
  const adminCheck = requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    const { id, deptId } = await params;
    await connectToDatabase();

    const department = await Department.findById(deptId);
    if (!department) {
      return errorResponse('Department not found', 404);
    }

    if (department.university.toString() !== id) {
      return errorResponse('Department does not belong to this university', 400);
    }

    const activeBatches = await Batch.countDocuments({ department: deptId, isActive: true });
    if (activeBatches > 0) {
      return errorResponse(
        'Cannot delete department with active batches. Deactivate all batches first.',
        400
      );
    }

    department.isActive = false;
    await department.save();

    return successResponse({ message: 'Department deactivated successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    return errorResponse('Internal server error', 500);
  }
}
