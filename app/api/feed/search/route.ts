import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Post from '@/models/Post';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!q || q.trim().length === 0) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    // Text search
    const posts = await Post.find(
      { $text: { $search: q }, isArchived: false },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .skip(skip)
    .limit(limit)
    .populate('author', 'fullName profilePicture')
    .lean();

    const totalCount = await Post.countDocuments({
      $text: { $search: q },
      isArchived: false
    });

    const formattedPosts = posts.map(post => ({
      _id: post._id,
      author: {
        _id: (post.author as any)._id,
        fullName: (post.author as any).fullName,
        profilePicture: (post.author as any).profilePicture
      },
      content: post.content,
      images: post.images,
      type: post.type,
      tags: post.tags,
      likes: post.likes.length,
      comments: post.commentCount,
      isLiked: user ? post.likes.some((id: any) => id.toString() === user._id.toString()) : false,
      createdAt: post.createdAt
    }));

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
    console.error('Error searching posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}