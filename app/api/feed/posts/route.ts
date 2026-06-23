import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Post, { PostType } from '@/models/Post';
import User from '@/models/User';
import University from '@/models/University';
import Connection from '@/models/Connection';
import Notification from '@/models/Notification';
import { NotificationType } from '@/models/Notification';
import { ConnectionStatus } from '@/models/Connection';
import { v2 as cloudinary } from 'cloudinary';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const content = formData.get('content') as string;
    const type = formData.get('type') as PostType || PostType.POST;
    const tags = formData.getAll('tags') as string[];

    // Validate content
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: 'Content exceeds 2000 characters' }, { status: 400 });
    }

    // Check permission for announcement type
    if (type === PostType.ANNOUNCEMENT) {
      const userDoc = await User.findById(user._id);
      if (userDoc?.role !== 'admin' && userDoc?.role !== 'moderator') {
        return NextResponse.json({ error: 'Only admins/moderators can create announcements' }, { status: 403 });
      }
    }

    // Create post first to get ID
    const post = new Post({
      author: user._id,
      content: content.trim(),
      type,
      tags,
      images: []
    });

    await post.save();

    // Upload images
    const imageUrls: string[] = [];
    const files = formData.getAll('images') as File[];

    for (const file of files) {
      if (imageUrls.length >= 5) break; // Max 5 images

      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const tempFilePath = join(tmpdir(), `upload_${Date.now()}_${file.name}`);
        await writeFile(tempFilePath, buffer);

        const uploadResult = await cloudinary.uploader.upload(tempFilePath, {
          folder: `alumni/posts/${post._id}`,
          resource_type: 'image',
          quality: 'auto',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' }
          ]
        });

        imageUrls.push(uploadResult.secure_url);
        await unlink(tempFilePath);
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }

    // Update post with image URLs
    if (imageUrls.length > 0) {
      post.images = imageUrls;
      await post.save();
    }

    // Populate author for response
    await post.populate('author', 'fullName profilePicture university verificationStatus');

    // Send notifications to connected students if author is alumni
    if (user.role === 'alumni') {
      try {
        // Find all accepted connections where this user is the requester or recipient
        const connections = await Connection.find({
          $or: [
            { requester: user._id, status: ConnectionStatus.ACCEPTED },
            { recipient: user._id, status: ConnectionStatus.ACCEPTED },
          ],
        }).select('requester recipient');

        // Get all connected user IDs
        const connectedUserIds = connections.map(conn => 
          conn.requester.toString() === user._id.toString() ? conn.recipient : conn.requester
        );

        // Get all connected users to check if they are students
        const connectedUsers = await User.find({
          _id: { $in: connectedUserIds },
          role: 'student',
        }).select('_id');

        // Create notifications for all connected students
        const notifications = connectedUsers.map(connectedUser => ({
          recipient: connectedUser._id,
          type: NotificationType.POST_CREATED,
          title: `${user.fullName} posted something`,
          body: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
          link: `/dashboard/feed`,
          actor: user._id,
          entityId: post._id,
          entityModel: 'Post',
        }));

        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      } catch (error) {
        console.error('Error sending notifications:', error);
        // Don't fail the post creation if notifications fail
      }
    }

    return NextResponse.json({
      post: {
        _id: post._id,
        author: {
          _id: post.author._id,
          fullName: (post.author as any).fullName,
          profilePicture: (post.author as any).profilePicture
        },
        content: post.content,
        images: post.images,
        type: post.type,
        tags: post.tags,
        likes: 0,
        comments: 0,
        shareCount: 0,
        createdAt: post.createdAt,
        isLiked: false,
        isSaved: false
      }
    });

  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}