import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }

) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;   // ✅ fix

  const messageId = id;


    // Find and verify ownership
    const message = await Message.findById(messageId);

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.sender.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Can only delete your own messages' }, { status: 403 });
    }

    if (message.isDeleted) {
      return NextResponse.json({ error: 'Message already deleted' }, { status: 400 });
    }

    // Soft delete the message
    await Message.findByIdAndUpdate(messageId, {
      isDeleted: true,
      deletedAt: new Date(),
      content: null, // Clear content
      attachments: [] // Clear attachments
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}