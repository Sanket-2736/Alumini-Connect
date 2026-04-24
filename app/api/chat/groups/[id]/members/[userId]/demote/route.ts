import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import mongoose from 'mongoose';

type Params = { params: Promise<{ id: string; userId: string }> };

// PUT /api/chat/groups/[id]/members/[userId]/demote
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, userId } = await params;

    const group = await Conversation.findOne({ _id: id, type: 'group', members: user._id });
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const isAdmin = group.admins.some((a: mongoose.Types.ObjectId) => a.toString() === user._id.toString());
    if (!isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    if (group.admins.length <= 1) {
      return NextResponse.json({ error: 'Cannot demote the last admin' }, { status: 400 });
    }

    group.admins = group.admins.filter((a: mongoose.Types.ObjectId) => a.toString() !== userId) as any;
    await group.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Demote member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
