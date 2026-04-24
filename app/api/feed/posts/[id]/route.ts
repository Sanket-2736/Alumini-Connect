import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import User from '@/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);

    const postId = params.id;

    // Get post with author details
    const post = await Post.findById(postId)
      .populate({
        path: 'author',
        select: 'fullName profilePicture university verificationStatus'
      })
      .populate({
        path: 'university',
        select: 'name'
      });

    if (!post || post.isArchived) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Get all comments with replies (2-level nesting)
    const comments = await Comment.find({
      post: postId,
      isDeleted: false,
      replyTo: null // Top-level comments only
    })
    .populate('author', 'fullName profilePicture profilePicture')
    .populate({
      path: 'likes',
      select: 'fullName'
    })
    .sort({ createdAt: -1 })
    .limit(3) // Top 3 comments
    .lean();

    // Get reply count for each comment
    const commentIds = comments.map(c => c._id);
    const replyCounts = await Comment.aggregate([
      { $match: { replyTo: { $in: commentIds }, isDeleted: false } },
      { $group: { _id: '$replyTo', count: { $sum: 1 } } }
    ]);

    const replyCountMap = Object.fromEntries(replyCounts.map(r => [r._id.toString(), r.count]));

    // Format response
    const formattedPost = {
      _id: post._id,
      author: {
        _id: (post.author as any)._id,
        fullName: (post.author as any).fullName,
        profilePicture: (post.author as any).profilePicture,
        verificationStatus: (post.author as any).verificationStatus,
        university: (post.university as any)?.name
      },
      content: post.content,
      images: post.images,
      type: post.type,
      tags: post.tags,
      likes: post.likes.length,
      comments: post.commentCount,
      shareCount: post.shareCount,
      isPinned: post.isPinned,
      isLiked: user ? post.likes.some(id => id.toString() === user._id.toString()) : false,
      isSaved: user ? (post.author as any).savedPosts?.includes(user._id) : false,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      topComments: comments.map(c => ({
        _id: c._id,
        author: {
          _id: (c.author as any)._id,
          fullName: (c.author as any).fullName,
          profilePicture: (c.author as any).profilePicture
        },
        content: c.content,
        likes: c.likes?.length || 0,
        replyCount: replyCountMap[c._id.toString()] || 0,
        createdAt: c.createdAt
      })),
      totalComments: post.commentCount
    };

    return NextResponse.json({ post: formattedPost });

  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const postId = params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check ownership
    if (post.author.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check edit window (30 minutes)
    const now = new Date();
    const editWindowMinutes = 30;
    const createdAtTime = new Date(post.createdAt).getTime();
    const nowTime = now.getTime();
    
    if (nowTime - createdAtTime > editWindowMinutes * 60 * 1000) {
      return NextResponse.json({ error: 'Edit window has expired (30 minutes)' }, { status: 403 });
    }

    const { content, tags } = await request.json();

    if (content && content.length > 2000) {
      return NextResponse.json({ error: 'Content exceeds 2000 characters' }, { status: 400 });
    }

    post.content = content || post.content;
    post.tags = tags || post.tags;
    await post.save();

    return NextResponse.json({ message: 'Post updated successfully', post });

  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Check authorization: author or admin/moderator
    const userDoc = await User.findById(user._id);
    const isAuthor = post.author.toString() === user._id.toString();
    const isAdmin = userDoc?.role === 'admin' || userDoc?.role === 'moderator';

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Soft delete
    post.isArchived = true;
    await post.save();

    return NextResponse.json({ message: 'Post deleted successfully' });

  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}