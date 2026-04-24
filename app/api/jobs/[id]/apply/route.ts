import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Job from '@/models/Job';
import { Types } from 'mongoose';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const userId = user._id.toString();

    // ✅ FIX: typed + safe comparison
    const alreadyApplied = job.applicants.some(
      (applicantId: Types.ObjectId) =>
        applicantId.toString() === userId
    );

    if (alreadyApplied) {
      return NextResponse.json(
        { error: 'You have already applied' },
        { status: 400 }
      );
    }

    // ✅ FIX: no "any"
    job.applicants.push(user._id as Types.ObjectId);

    await job.save();

    return NextResponse.json({
      message: 'Applied successfully',
      applicantCount: job.applicants.length,
    });

  } catch (error) {
    console.error('Error applying to job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}