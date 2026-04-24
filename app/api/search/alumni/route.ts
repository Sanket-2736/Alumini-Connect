import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Connection from '@/models/Connection';
import { getUserFromRequest } from '@/lib/auth';
import { VerificationStatus } from '@/lib/enums';
import { successResponse, errorResponse } from '@/lib/apiResponse';

/**
 * GET /api/search/alumni
 * Search alumni with filters
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const university = searchParams.get('university');
    const batch = searchParams.get('batch');
    const department = searchParams.get('department');
    const company = searchParams.get('company');
    const skills = searchParams.get('skills')?.split(',').filter(s => s.trim()) || [];
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const onlyVerified = searchParams.get('onlyVerified') === 'true';

    const skip = (page - 1) * limit;

    await connectToDatabase();

    // Build query
    const query: any = {
      isBanned: false,
      _id: { $ne: user._id }, // Exclude self
    };

    // Add verification filter
    if (onlyVerified) {
      query.verificationStatus = VerificationStatus.APPROVED;
    }

    // University filter
    if (university) {
      const universityDoc = await User.findOne({ 'university.slug': university });
      if (universityDoc) {
        query.university = universityDoc.university;
      }
    }

    // Other filters
    if (batch) query.batch = batch;
    if (department) query.department = department;
    if (company) {
      query['workDetails.company'] = { $regex: company, $options: 'i' };
    }
    if (skills.length > 0) {
      query.skills = { $in: skills.map(skill => new RegExp(skill, 'i')) };
    }

    // Text search
    if (q.trim()) {
      query.$or = [
        { fullName: { $regex: q, $options: 'i' } },
        { 'workDetails.company': { $regex: q, $options: 'i' } },
        { skills: { $in: [new RegExp(q, 'i')] } },
      ];
    }

    // Get total count
    const total = await User.countDocuments(query);

    // Get users with pagination
    const users = await User.find(query)
      .populate('university', 'name slug')
      .select('_id fullName profilePicture university department batch workDetails skills verificationStatus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get connection statuses for these users
    const userIds = users.map(u => u._id);
    const connections = await Connection.find({
      $or: [
        { requester: user._id, recipient: { $in: userIds } },
        { requester: { $in: userIds }, recipient: user._id },
      ],
    });

    // Create connection status map
    const connectionMap = new Map<string, string>();
    connections.forEach(conn => {
      const otherUserId = conn.requester.toString() === user._id.toString()
        ? conn.recipient.toString()
        : conn.requester.toString();

      let status = 'none';
      if (conn.status === 'accepted') {
        status = 'connected';
      } else if (conn.status === 'pending') {
        if (conn.requester.toString() === user._id.toString()) {
          status = 'pending_sent';
        } else {
          status = 'pending_received';
        }
      } else if (conn.status === 'rejected' && conn.recipient.toString() === user._id.toString()) {
        status = 'rejected';
      }

      connectionMap.set(otherUserId, status);
    });

    // Add connection status to users
    const usersWithConnectionStatus = users.map(user => ({
      ...user.toObject(),
      connectionStatus: connectionMap.get(user._id.toString()) || 'none',
    }));

    return successResponse({
      users: usersWithConnectionStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Search alumni error:', error);
    return errorResponse('Internal server error', 500);
  }
}