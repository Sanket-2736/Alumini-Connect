import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';

export async function POST(
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

    const { emoji } = await request.json();

    if (!emoji) {
      return NextResponse.json({ error: 'Emoji is required' }, { status: 400 });
    }

    // Find the message
    const message = await Message.findById(messageId);

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.isDeleted) {
      return NextResponse.json({ error: 'Cannot react to deleted message' }, { status: 400 });
    }

    // Check if user already reacted with this emoji
    const existingReactionIndex = message.reactions.findIndex(
      (reaction: { userId: { toString(): string }; emoji: string }) =>
        reaction.userId.toString() === user._id.toString() && reaction.emoji === emoji
    );

    if (existingReactionIndex >= 0) {
      // Remove the reaction (toggle off)
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Add the reaction
      message.reactions.push({
        userId: user._id,
        emoji
      });
    }

    await message.save();

    return NextResponse.json({
      reactions: message.reactions,
      success: true
    });

  } catch (error) {
    console.error('Error reacting to message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}