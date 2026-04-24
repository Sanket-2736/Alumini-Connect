import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import User from '@/models/User';
import { createNotification } from '@/lib/services/notificationService';
import { NotificationType } from '@/models/Notification';
import mongoose from 'mongoose';

type Params = { params: Promise<{ id: string }> };

// POST /api/chat/groups/[id]/members — add members (admin only)
export async function POST(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { userIds } = await request.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'userIds array is required' }, { status: 400 });
    }

    const group = await Conversation.findOne({ _id: id, type: 'group', members: user._id });
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const isAdmin = group.admins.some((a: mongoose.Types.ObjectId) => a.toString() === user._id.toString());
    if (!isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    const currentMemberCount = group.members.length;
    if (currentMemberCount + userIds.length > 500) {
      return NextResponse.json({ error: 'Would exceed 500 member limit' }, { status: 400 });
    }

    // Validate users exist
    const newUsers = await User.find({ _id: { $in: userIds }, isBanned: false }).select('_id fullName');
    const newUserIds = newUsers.map((u) => u._id.toString());

    // Filter out already-members
    const existingMemberIds = group.members.map((m: mongoose.Types.ObjectId) => m.toString());
    const toAdd = newUserIds.filter((uid) => !existingMemberIds.includes(uid));

    if (toAdd.length === 0) {
      return NextResponse.json({ error: 'All users are already members' }, { status: 400 });
    }

    group.members.push(...(toAdd as any));
    group.participants.push(...(toAdd as any));
    await group.save();

    // Notify added members
    await Promise.all(
      toAdd.map((memberId) =>
        createNotification({
          recipientId: memberId,
          type: NotificationType.GROUP_ADDED,
          actorId: user._id.toString(),
          title: `Added to group: ${group.name}`,
          body: `${user.fullName} added you to "${group.name}"`,
          link: `/dashboard/messages`,
          entityId: group._id.toString(),
          entityModel: 'Conversation',
        })
      )
    );

    // Emit group:member_added via socket if available
    if ((global as any)._socketIO) {
      const io = (global as any)._socketIO;
      const addedUsers = newUsers.filter((u) => toAdd.includes(u._id.toString()));
      const allMemberIds = group.members.map((m: mongoose.Types.ObjectId) => m.toString());
      addedUsers.forEach((addedUser) => {
        allMemberIds.forEach((mid: string) => {
          io.to(`user:${mid}`).emit('group:member_added', {
            conversationId: id,
            addedUser: { _id: addedUser._id, fullName: addedUser.fullName },
          });
        });
      });
    }

    return NextResponse.json({ success: true, added: toAdd.length });
  } catch (error) {
    console.error('Add members error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
