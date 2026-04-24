import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';

type Params = { params: Promise<{ id: string; userId: string }> };

// PUT /api/chat/groups/[id]/members/[userId]/promote
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

    const isMember = group.members.some((m: mongoose.Types.ObjectId) => m.toString() === userId);
    if (!isMember) return NextResponse.json({ error: 'User is not a member' }, { status: 400 });

    const alreadyAdmin = group.admins.some((a: mongoose.Types.ObjectId) => a.toString() === userId);
    if (alreadyAdmin) return NextResponse.json({ error: 'User is already an admin' }, { status: 400 });

    group.admins.push(userId as any);
    await group.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Promote member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
