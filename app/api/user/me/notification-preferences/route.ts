import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// PUT /api/user/me/notification-preferences
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { emailOnMessage, emailOnConnection, emailOnJob } = await request.json();

    const update: Record<string, boolean> = {};
    if (typeof emailOnMessage === 'boolean') update['notificationPreferences.emailOnMessage'] = emailOnMessage;
    if (typeof emailOnConnection === 'boolean') update['notificationPreferences.emailOnConnection'] = emailOnConnection;
    if (typeof emailOnJob === 'boolean') update['notificationPreferences.emailOnJob'] = emailOnJob;

    await User.findByIdAndUpdate(user._id, { $set: update });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
