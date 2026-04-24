import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Comment from '@/models/Comment';

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

    const commentId = params.id;
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const alreadyLiked = comment.likes.some(id => id.toString() === user._id.toString());

    if (alreadyLiked) {
      comment.likes = comment.likes.filter(id => id.toString() !== user._id.toString());
    } else {
      comment.likes.push(user._id as any);
    }

    await comment.save();

    return NextResponse.json({
      isLiked: !alreadyLiked,
      likeCount: comment.likes.length
    });

  } catch (error) {
    console.error('Error liking comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}