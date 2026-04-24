import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Comment from '@/models/Comment';
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
const commentId = id;
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const alreadyLiked = comment.likes.some((id: Types.ObjectId) =>
  id.toString() === user._id.toString()
);

if (alreadyLiked) {
  comment.likes = comment.likes.filter((id: Types.ObjectId) =>
    id.toString() !== user._id.toString()
  );
} else {
  comment.likes.push(user._id as Types.ObjectId);
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