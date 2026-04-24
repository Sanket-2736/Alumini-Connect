import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Job from '@/models/Job';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get jobs posted by user
    const jobs = await Job.find({ postedBy: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await Job.countDocuments({ postedBy: user._id });

    const formattedJobs = jobs.map(job => ({
      _id: job._id,
      title: job.title,
      company: job.company,
      status: job.status,
      applicantCount: job.applicants.length,
      viewCount: job.viewCount,
      createdAt: job.createdAt,
      expiresAt: job.expiresAt
    }));

    return NextResponse.json({
      jobs: formattedJobs,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching my posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}