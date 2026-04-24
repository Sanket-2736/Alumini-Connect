import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Post from '@/models/Post';
import User from '@/models/User';

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

    // Check if admin/moderator
    const userDoc = await User.findById(user._id);
    if (userDoc?.role !== 'admin' && userDoc?.role !== 'moderator') {
      return NextResponse.json({ error: 'Only admins/moderators can pin posts' }, { status: 403 });
    }

    const postId = params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Toggle pin status
    post.isPinned = !post.isPinned;
    await post.save();

    return NextResponse.json({
      isPinned: post.isPinned,
      message: post.isPinned ? 'Post pinned' : 'Post unpinned'
    });

  } catch (error) {
    console.error('Error pinning post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}