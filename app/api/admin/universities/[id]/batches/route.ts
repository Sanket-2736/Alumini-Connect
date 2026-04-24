import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import University from '@/models/University';
import Department from '@/models/Department';
import Batch from '@/models/Batch';
import { requireAdmin } from '@/lib/admin';
import { successResponse, errorResponse } from '@/lib/apiResponse';

/**
 * GET /api/admin/universities/[id]/batches
 * Admin only - list batches for a university
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    const { id } = await params;
    await connectToDatabase();

    const university = await University.findById(id);
    if (!university) {
      return errorResponse('University not found', 404);
    }

    const batches = await Batch.find({ university: id })
      .sort({ year: -1, label: 1 })
      .populate('university', 'name slug')
      .populate('department', 'name');

    return successResponse(batches, 'Batches retrieved successfully');
  } catch (error) {
    console.error('Get batches error:', error);
    return errorResponse('Internal server error', 500);
  }
}

/**
 * POST /api/admin/universities/[id]/batches
 * Admin only - create batch for a university
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    const { id } = await params;
    const { year, label, departmentId } = await request.json();

    if (!year || !label || !label.trim()) {
      return errorResponse('Year and label are required', 400);
    }

    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear();
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear + 10) {
      return errorResponse('Invalid year format', 400);
    }

    await connectToDatabase();

    const university = await University.findById(id);
    if (!university) {
      return errorResponse('University not found', 404);
    }

    if (!university.isActive) {
      return errorResponse('Cannot add batches to inactive university', 400);
    }

    if (departmentId) {
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
      ...(departmentId && { department: departmentId }),
    });

    if (existingBatch) {
      return errorResponse('Batch with this year and label already exists', 409);
    }

    const batch = new Batch({
      year: yearNum,
      label: label.trim(),
      university: id,
      department: departmentId || null,
    });

    await batch.save();
    await batch.populate('university', 'name slug');
    if (departmentId) await batch.populate('department', 'name');

    return successResponse(batch, 'Batch created successfully', 201);
  } catch (error) {
    console.error('Create batch error:', error);
    return errorResponse('Internal server error', 500);
  }
}
