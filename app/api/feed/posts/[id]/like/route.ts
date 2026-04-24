import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Post from '@/models/Post';

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

    const postId = params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if already liked
    const alreadyLiked = post.likes.some(id => id.toString() === user._id.toString());

    if (alreadyLiked) {
      // Unlike
      post.likes = post.likes.filter(id => id.toString() !== user._id.toString());
    } else {
      // Like
      post.likes.push(user._id as any);
    }

    await post.save();

    return NextResponse.json({
      isLiked: !alreadyLiked,
      likeCount: post.likes.length
    });

  } catch (error) {
    console.error('Error liking post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}