import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import University from '@/models/University';
import Department from '@/models/Department';
import { requireAdmin } from '@/lib/admin';
import { successResponse, errorResponse } from '@/lib/apiResponse';

/**
 * GET /api/admin/universities/[id]/departments
 * Admin only - list departments for a university
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

    const departments = await Department.find({ university: id, isActive: true })
      .sort({ name: 1 })
      .populate('university', 'name slug');

    return successResponse(departments, 'Departments retrieved successfully');
  } catch (error) {
    console.error('Get departments error:', error);
    return errorResponse('Internal server error', 500);
  }
}

/**
 * POST /api/admin/universities/[id]/departments
 * Admin only - create department for a university
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    const { id } = await params;
    const { name, description } = await request.json();

    if (!name || !name.trim()) {
      return errorResponse('Department name is required', 400);
    }

    await connectToDatabase();

    const university = await University.findById(id);
    if (!university) {
      return errorResponse('University not found', 404);
    }

    if (!university.isActive) {
      return errorResponse('Cannot add departments to inactive university', 400);
    }

    const existingDepartment = await Department.findOne({
      university: id,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      isActive: true,
    });

    if (existingDepartment) {
      return errorResponse('Department with this name already exists in this university', 409);
    }

    const department = new Department({
      name: name.trim(),
      description: description?.trim() || '',
      university: id,
      isActive: true,
    });

    await department.save();
    await department.populate('university', 'name slug');

    return successResponse(department, 'Department created successfully', 201);
  } catch (error) {
    console.error('Create department error:', error);
    return errorResponse('Internal server error', 500);
  }
}
