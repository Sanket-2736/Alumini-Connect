import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Conversation, { ConversationType, GroupType } from '@/models/Conversation';
import User from '@/models/User';
import { v2 as cloudinary } from 'cloudinary';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { createNotification } from '@/lib/services/notificationService';
import { NotificationType } from '@/models/Notification';
import { nanoid } from 'nanoid';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /api/chat/groups — create a group
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const contentType = request.headers.get('content-type') || '';
    let name: string, description: string | undefined, memberIds: string[],
      groupType: string, avatarFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      name = formData.get('name') as string;
      description = formData.get('description') as string | undefined;
      memberIds = JSON.parse((formData.get('memberIds') as string) || '[]');
      groupType = (formData.get('groupType') as string) || GroupType.CUSTOM;
      avatarFile = formData.get('avatar') as File | null;
    } else {
      const body = await request.json();
      name = body.name;
      description = body.description;
      memberIds = body.memberIds || [];
      groupType = body.groupType || GroupType.CUSTOM;
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    const allMemberIds = [...new Set([user._id.toString(), ...memberIds])];

    if (allMemberIds.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 members allowed' }, { status: 400 });
    }

    // Validate members exist
    const members = await User.find({ _id: { $in: allMemberIds }, isBanned: false }).select('_id');
    if (members.length !== allMemberIds.length) {
      return NextResponse.json({ error: 'One or more members not found' }, { status: 400 });
    }

    // Upload avatar if provided
    let groupAvatar: string | undefined;
    if (avatarFile && avatarFile.size > 0) {
      const bytes = await avatarFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const tempPath = join(tmpdir(), `group_avatar_${Date.now()}`);
      await writeFile(tempPath, buffer);
      try {
        const result = await cloudinary.uploader.upload(tempPath, {
          folder: 'alumni/groups',
          transformation: [{ width: 300, height: 300, crop: 'fill' }, { quality: 'auto' }],
        });
        groupAvatar = result.secure_url;
      } finally {
        await unlink(tempPath).catch(() => {});
      }
    }

    const conversation = await Conversation.create({
      type: ConversationType.GROUP,
      participants: allMemberIds,
      members: allMemberIds,
      admins: [user._id],
      name: name.trim(),
      description: description?.trim(),
      groupAvatar,
      groupType: groupType as GroupType,
      inviteLink: nanoid(12),
      lastActivity: new Date(),
    });

    // Notify added members (except creator)
    const otherMembers = allMemberIds.filter((id) => id !== user._id.toString());
    await Promise.all(
      otherMembers.map((memberId) =>
        createNotification({
          recipientId: memberId,
          type: NotificationType.GROUP_ADDED,
          actorId: user._id.toString(),
          title: `Added to group: ${name}`,
          body: `${user.fullName} added you to the group "${name}"`,
          link: `/dashboard/messages`,
          entityId: conversation._id.toString(),
          entityModel: 'Conversation',
        })
      )
    );

    await conversation.populate('members', 'fullName profilePicture');

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error('Create group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
