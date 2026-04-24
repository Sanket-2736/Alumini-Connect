import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Job from '@/models/Job';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobId = params.id;
    const job = await Job.findById(jobId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if already applied
    if (job.applicants.some(id => id.toString() === user._id.toString())) {
      return NextResponse.json({ error: 'You have already applied' }, { status: 400 });
    }

    // Add user to applicants
    job.applicants.push(user._id as any);
    await job.save();

    // TODO: Create notification for job poster

    return NextResponse.json({
      message: 'Applied successfully',
      applicantCount: job.applicants.length
    });

  } catch (error) {
    console.error('Error applying to job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}