import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import mongoose from 'mongoose';

type Params = { params: Promise<{ id: string; userId: string }> };

// DELETE /api/chat/groups/[id]/members/[userId] — remove member or leave
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, userId } = await params;
    const isSelf = userId === user._id.toString();

    const group = await Conversation.findOne({ _id: id, type: 'group', members: user._id });
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const isAdmin = group.admins.some((a: mongoose.Types.ObjectId) => a.toString() === user._id.toString());

    // Only admin can remove others; anyone can remove themselves
    if (!isSelf && !isAdmin) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    // Cannot remove the last admin
    if (isAdmin && group.admins.length === 1 && group.admins[0].toString() === userId) {
      return NextResponse.json(
        { error: 'Cannot remove the last admin. Promote another member first.' },
        { status: 400 }
      );
    }

    group.members = group.members.filter((m: mongoose.Types.ObjectId) => m.toString() !== userId) as any;
    group.participants = group.participants.filter((p: mongoose.Types.ObjectId) => p.toString() !== userId) as any;
    group.admins = group.admins.filter((a: mongoose.Types.ObjectId) => a.toString() !== userId) as any;
    await group.save();

    // Emit group:member_removed
    if ((global as any)._socketIO) {
      const io = (global as any)._socketIO;
      const allMemberIds = group.members.map((m: mongoose.Types.ObjectId) => m.toString());
      allMemberIds.forEach((mid: string) => {
        io.to(`user:${mid}`).emit('group:member_removed', {
          conversationId: id,
          removedUserId: userId,
          removedBy: user._id.toString(),
        });
      });
      // Also notify the removed user
      io.to(`user:${userId}`).emit('group:member_removed', {
        conversationId: id,
        removedUserId: userId,
        removedBy: user._id.toString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
