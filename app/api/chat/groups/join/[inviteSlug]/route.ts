import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import mongoose from 'mongoose';

type Params = { params: Promise<{ inviteSlug: string }> };

// POST /api/chat/groups/join/[inviteSlug]
export async function POST(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.isBanned) return NextResponse.json({ error: 'Account is banned' }, { status: 403 });

    const { inviteSlug } = await params;

    const group = await Conversation.findOne({
      inviteLink: inviteSlug,
      type: 'group',
      isArchived: false,
    });

    if (!group) return NextResponse.json({ error: 'Invalid or expired invite link' }, { status: 404 });

    const alreadyMember = group.members.some((m: mongoose.Types.ObjectId) => m.toString() === user._id.toString());
    if (alreadyMember) {
      return NextResponse.json({ conversation: group, alreadyMember: true });
    }

    if (group.members.length >= 500) {
      return NextResponse.json({ error: 'Group is full (500 member limit)' }, { status: 400 });
    }

    group.members.push(user._id as any);
    group.participants.push(user._id as any);
    await group.save();

    // Notify existing members
    if ((global as any)._socketIO) {
      const io = (global as any)._socketIO;
      const allMemberIds = group.members.map((m: mongoose.Types.ObjectId) => m.toString());
      allMemberIds.forEach((mid: string) => {
        io.to(`user:${mid}`).emit('group:member_added', {
          conversationId: group._id.toString(),
          addedUser: { _id: user._id, fullName: user.fullName },
        });
      });
    }

    return NextResponse.json({ conversation: group });
  } catch (error) {
    console.error('Join group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
