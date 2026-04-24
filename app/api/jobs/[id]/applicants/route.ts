import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Job from '@/models/Job';

export async function GET(
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
    const job = await Job.findById(jobId).populate('applicants', 'fullName profilePicture email university department batch');

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check authorization (only poster can view applicants)
    if (job.postedBy.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const applicants = (job.applicants as any[]).map(applicant => ({
      _id: applicant._id,
      fullName: applicant.fullName,
      profilePicture: applicant.profilePicture,
      email: applicant.email,
      university: applicant.university,
      department: applicant.department,
      batch: applicant.batch
    }));

    return NextResponse.json({ applicants });

  } catch (error) {
    console.error('Error fetching applicants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}