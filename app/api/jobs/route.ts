import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Job, { JobStatus } from '@/models/Job';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const experienceLevel = searchParams.get('experienceLevel');
    const isRemote = searchParams.get('isRemote') === 'true';
    const isReferral = searchParams.get('isReferral') === 'true';
    const skills = searchParams.getAll('skills');
    const university = searchParams.get('university');
    const q = searchParams.get('q'); // Text search
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    // Build filter query
    const filter: any = {
      status: JobStatus.ACTIVE,
      expiresAt: { $gt: new Date() }
    };

    if (type) filter.type = type;
    if (experienceLevel && experienceLevel !== 'any') filter.experienceLevel = experienceLevel;
    if (isRemote) filter.isRemote = true;
    if (isReferral) filter.isReferral = true;
    if (university) filter.university = university;
    if (skills && skills.length > 0) {
      filter.skills = { $in: skills };
    }

    // Text search if q is provided
    if (q) {
      filter.$text = { $search: q };
    }

    // Build query
    let query = Job.find(filter)
      .populate('postedBy', 'fullName profilePicture company university')
      .populate('university', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    if (q) {
      query = query.select({ score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } });
    }

    const jobs = await query.lean();
    const totalCount = await Job.countDocuments(filter);

    // Format response and add user-specific fields
    const formattedJobs = jobs.map(job => ({
      _id: job._id,
      title: job.title,
      company: job.company,
      location: job.location,
      isRemote: job.isRemote,
      type: job.type,
      experienceLevel: job.experienceLevel,
      skills: job.skills.slice(0, 4), // Top 4 skills
      postedBy: {
        _id: (job.postedBy as any)._id,
        fullName: (job.postedBy as any).fullName,
        profilePicture: (job.postedBy as any).profilePicture,
        company: (job.postedBy as any).company
      },
      isReferral: job.isReferral,
      deadline: job.deadline,
      applicantCount: job.applicants.length,
      viewCount: job.viewCount,
      salary: job.salary,
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
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is verified alumni or admin
    const userDoc = await User.findById(user._id);
    if (userDoc?.verificationStatus !== 'approved' && userDoc?.role !== 'admin') {
      return NextResponse.json({ error: 'Only verified alumni or admins can post jobs' }, { status: 403 });
    }

    const {
      title,
      company,
      location,
      isRemote,
      type,
      experienceLevel,
      description,
      requirements,
      applyLink,
      isReferral,
      referralNote,
      salary,
      skills,
      deadline
    } = await request.json();

    // Validate required fields
    if (!title || !company || !type || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate applyLink URL if provided
    if (applyLink) {
      try {
        new URL(applyLink);
      } catch {
        return NextResponse.json({ error: 'Invalid apply link URL' }, { status: 400 });
      }
    }

    // Create job
    const job = new Job({
      postedBy: user._id,
      title,
      company,
      location,
      isRemote,
      type,
      experienceLevel: experienceLevel || 'any',
      description,
      requirements: requirements || [],
      applyLink,
      isReferral,
      referralNote,
      salary: salary || { isDisclosed: false },
      skills: skills || [],
      deadline
    });

    await job.save();

    // Create notifications for connected users (batch in groups of 50)
    try {
      const connections = await (require('@/models/Connection')).default
        .find({
          $or: [
            { requester: user._id, status: 'accepted' },
            { recipient: user._id, status: 'accepted' }
          ]
        })
        .select('requester recipient');

      const connectedUserIds = new Set();
      connections.forEach((conn: any) => {
        if (conn.requester.toString() !== user._id.toString()) {
          connectedUserIds.add(conn.requester);
        }
        if (conn.recipient.toString() !== user._id.toString()) {
          connectedUserIds.add(conn.recipient);
        }
      });

      // TODO: Create notifications in batches of 50
    } catch (error) {
      console.error('Error creating job notifications:', error);
    }

    return NextResponse.json({
      job: {
        _id: job._id,
        title: job.title,
        company: job.company,
        createdAt: job.createdAt,
        expiresAt: job.expiresAt
      }
    });

  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}