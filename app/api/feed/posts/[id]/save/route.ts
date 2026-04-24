import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import Job from '@/models/Job'; // ✅ correct model
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

    // ✅ FIXED: typed id
    const alreadyApplied = job.applicants.some(
      (applicantId: Types.ObjectId) =>
        applicantId.toString() === user._id.toString()
    );

    if (alreadyApplied) {
      return NextResponse.json(
        { error: 'You have already applied' },
        { status: 400 }
      );
    }

    job.applicants.push(user._id as Types.ObjectId);

    await job.save();

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error applying to job:', error);
    return NextResponse.json(
      { error: 'Failed to apply' },
      { status: 500 }
    );
  }
}