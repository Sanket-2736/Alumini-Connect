import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Job from '@/models/Job';
import User from '@/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);

    const jobId = params.id;

    // Get job and increment view count
    const job = await Job.findByIdAndUpdate(
      jobId,
      { $inc: { viewCount: 1 } },
      { new: true }
    )
    .populate('postedBy', 'fullName profilePicture company bio university')
    .populate('university', 'name')
    .lean();

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const formattedJob = {
      _id: job._id,
      title: job.title,
      company: job.company,
      location: job.location,
      isRemote: job.isRemote,
      type: job.type,
      experienceLevel: job.experienceLevel,
      description: job.description,
      requirements: job.requirements,
      skills: job.skills,
      salary: job.salary,
      deadline: job.deadline,
      isReferral: job.isReferral,
      referralNote: job.referralNote,
      applyLink: job.applyLink,
      applicantCount: job.applicants.length,
      viewCount: job.viewCount,
      postedBy: {
        _id: (job.postedBy as any)._id,
        fullName: (job.postedBy as any).fullName,
        profilePicture: (job.postedBy as any).profilePicture,
        company: (job.postedBy as any).company,
        bio: (job.postedBy as any).bio,
        university: (job.university as any)?.name
      },
      hasApplied: user ? job.applicants.some((id: any) => id.toString() === user._id.toString()) : false,
      createdAt: job.createdAt,
      expiresAt: job.expiresAt
    };

    return NextResponse.json({ job: formattedJob });

  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
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

    // Check authorization
    const isOwner = job.postedBy.toString() === user._id.toString();
    const userDoc = await User.findById(user._id);
    const isAdmin = userDoc?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Cannot edit if applicants exist
    if (job.applicants.length > 0) {
      return NextResponse.json({ error: 'Cannot edit job after applicants have applied' }, { status: 403 });
    }

    const {
      description,
      requirements,
      salary,
      skills,
      deadline,
      applyLink
    } = await request.json();

    if (description) job.description = description;
    if (requirements) job.requirements = requirements;
    if (salary) job.salary = salary;
    if (skills) job.skills = skills;
    if (deadline) job.deadline = deadline;
    if (applyLink) job.applyLink = applyLink;

    await job.save();

    return NextResponse.json({ message: 'Job updated successfully', job });

  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Check authorization
    const isOwner = job.postedBy.toString() === user._id.toString();
    const userDoc = await User.findById(user._id);
    const isAdmin = userDoc?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Soft delete by setting status to closed
    job.status = 'closed';
    await job.save();

    return NextResponse.json({ message: 'Job closed successfully' });

  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}