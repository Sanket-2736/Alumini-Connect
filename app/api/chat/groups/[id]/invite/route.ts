import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import { nanoid } from 'nanoid';
import mongoose from 'mongoose';

type Params = { params: Promise<{ id: string }> };

// GET /api/chat/groups/[id]/invite — get invite link
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const group = await Conversation.findOne({ _id: id, type: 'group', members: user._id });
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.json({
      inviteLink: group.inviteLink,
      inviteUrl: `${appUrl}/dashboard/messages/join/${group.inviteLink}`,
    });
  } catch (error) {
    console.error('Get invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/chat/groups/[id]/invite — regenerate invite link (admin only)
export async function POST(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const group = await Conversation.findOne({ _id: id, type: 'group', members: user._id });
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const isAdmin = group.admins.some((a: mongoose.Types.ObjectId) => a.toString() === user._id.toString());
    if (!isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    group.inviteLink = nanoid(12);
    await group.save();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.json({
      inviteLink: group.inviteLink,
      inviteUrl: `${appUrl}/dashboard/messages/join/${group.inviteLink}`,
    });
  } catch (error) {
    console.error('Regenerate invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
