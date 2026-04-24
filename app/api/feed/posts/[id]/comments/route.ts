import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Post from '@/models/Post';
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

    const postId = params.id;
    const { content, replyToId } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ error: 'Comment exceeds 500 characters' }, { status: 400 });
    }

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Create comment
    const comment = new Comment({
      post: postId,
      author: user._id,
      content: content.trim(),
      replyTo: replyToId || null
    });

    await comment.save();

    // Increment comment count
    post.commentCount += 1;
    await post.save();

    // Populate author for response
    await comment.populate('author', 'fullName profilePicture');

    return NextResponse.json({
      comment: {
        _id: comment._id,
        author: {
          _id: (comment.author as any)._id,
          fullName: (comment.author as any).fullName,
          profilePicture: (comment.author as any).profilePicture
        },
        content: comment.content,
        likes: 0,
        replyCount: 0,
        createdAt: comment.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}