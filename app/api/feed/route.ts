import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Post from '@/models/Post';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'global'; // global | university
    const type = searchParams.get('type') || 'all'; // all | announcement | success_story
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build type filter
    const typeFilter: any = {};
    if (type !== 'all') {
      typeFilter.type = type;
    }

    // Build scope filter
    const scopeFilter: any = {};
    if (scope === 'university' && user) {
      const userDoc = await User.findById(user._id);
      if (userDoc?.university) {
        scopeFilter.university = userDoc.university;
      }
    }

    // Aggregation pipeline for engagement scoring
    const pipeline: any[] = [
      {
        $match: {
          isArchived: false,
          ...typeFilter,
          ...scopeFilter
        }
      },
      // Add engagement score
      {
        $addFields: {
          likeCount: { $size: '$likes' },
          daysSinceCreated: {
            $divide: [
              { $subtract: [new Date(), '$createdAt'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $addFields: {
          recencyScore: {
            $max: [0, { $subtract: [1, { $divide: ['$daysSinceCreated', 30] }] }]
          },
          engagementScore: {
            $add: [
              { $multiply: ['$likeCount', 0.4] },
              { $multiply: ['$commentCount', 0.3] },
              { $multiply: [{ $max: [0, { $subtract: [1, { $divide: ['$daysSinceCreated', 30] }] }] }, 0.3] }
            ]
          }
        }
      },
      // Sort: pinned first, then by engagement score
      {
        $sort: { isPinned: -1, engagementScore: -1, createdAt: -1 }
      },
      // Pagination
      { $skip: skip },
      { $limit: limit },
      // Populate author
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'authorData'
        }
      },
      { $unwind: '$authorData' },
      // Populate university
      {
        $lookup: {
          from: 'universities',
          localField: 'university',
          foreignField: '_id',
          as: 'universityData'
        }
      },
      { $unwind: { path: '$universityData', preserveNullAndEmptyArrays: true } }
    ];

    const posts = await Post.aggregate(pipeline) as any[];

    // Add isLiked and isSaved flags for current user
    const formattedPosts = posts.map(post => ({
      ...post,
      _id: post._id.toString(),
      author: {
        _id: post.authorData._id,
        fullName: post.authorData.fullName,
        profilePicture: post.authorData.profilePicture,
        university: post.universityData?.name,
        verificationStatus: post.authorData.verificationStatus
      },
      isLiked: user ? post.likes.some((id: any) => id.toString() === user._id.toString()) : false,
      isSaved: user ? (post.authorData.savedPosts?.includes(user._id)) : false,
      likes: post.likes.length,
      comments: post.commentCount
    }));

    // Get total count
    const totalCount = await Post.countDocuments({
      isArchived: false,
      ...typeFilter,
      ...scopeFilter
    });

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching feed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}