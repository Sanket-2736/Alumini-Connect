import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Post from '@/models/Post';
import { Types } from 'mongoose';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const alreadyLiked = post.likes.some((id: Types.ObjectId) =>
      id.toString() === user._id.toString()
    );

    if (alreadyLiked) {
      post.likes = post.likes.filter((id: Types.ObjectId) =>
        id.toString() !== user._id.toString()
      );
    } else {
      post.likes.push(user._id as Types.ObjectId);
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