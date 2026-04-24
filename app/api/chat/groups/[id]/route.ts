import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import { v2 as cloudinary } from 'cloudinary';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import mongoose from 'mongoose';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

type Params = { params: Promise<{ id: string }> };

// GET /api/chat/groups/[id] — group info + paginated members
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const group = await Conversation.findOne({
      _id: id,
      type: 'group',
      members: user._id,
    })
      .populate('admins', 'fullName profilePicture')
      .populate({
        path: 'members',
        select: 'fullName profilePicture department batch',
        options: { skip: (page - 1) * limit, limit },
      })
      .lean();

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const totalMembers = await Conversation.findById(id).select('members').lean() as any;
    const memberCount = totalMembers?.members?.length || 0;

    const adminIds = new Set((group.admins as any[]).map((a: any) => a._id.toString()));

    return NextResponse.json({
      group: {
        ...group,
        memberCount,
        members: (group.members as any[]).map((m: any) => ({
          ...m,
          role: adminIds.has(m._id.toString()) ? 'admin' : 'member',
        })),
      },
    });
  } catch (error) {
    console.error('Get group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/chat/groups/[id] — update group (admin only)
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const group = await Conversation.findOne({ _id: id, type: 'group', members: user._id });
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const isAdmin = group.admins.some((a: mongoose.Types.ObjectId) => a.toString() === user._id.toString());
    if (!isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    const contentType = request.headers.get('content-type') || '';
    let name: string | undefined, description: string | undefined, avatarFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      name = formData.get('name') as string | undefined;
      description = formData.get('description') as string | undefined;
      avatarFile = formData.get('avatar') as File | null;
    } else {
      const body = await request.json();
      name = body.name;
      description = body.description;
    }

    if (name !== undefined) group.name = name.trim();
    if (description !== undefined) group.description = description.trim();

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
        group.groupAvatar = result.secure_url;
      } finally {
        await unlink(tempPath).catch(() => {});
      }
    }

    await group.save();
    return NextResponse.json({ group });
  } catch (error) {
    console.error('Update group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/chat/groups/[id] — archive group (admin only)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const group = await Conversation.findOne({ _id: id, type: 'group', members: user._id });
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const isAdmin = group.admins.some((a: mongoose.Types.ObjectId) => a.toString() === user._id.toString());
    if (!isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    group.isArchived = true;
    await group.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Archive group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
