import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';

type Params = { params: Promise<{ id: string }> };

// PUT /api/notifications/[id]/read
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
