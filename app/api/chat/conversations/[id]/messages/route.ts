import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.id;
    const { searchParams } = new URL(request.url);
    const before = searchParams.get('before'); // Cursor for pagination
    const limit = parseInt(searchParams.get('limit') || '30');

    // Verify user is participant in conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: user._id
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Build query for messages
    const query: any = {
      conversationId,
      isDeleted: false
    };

    if (before) {
      query._id = { $lt: before }; // Cursor-based pagination
    }

    // Get messages with pagination
    const messages = await Message.find(query)
      .populate('sender', 'fullName profilePicture')
      .populate('replyTo', 'content sender')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Reverse to get chronological order
    messages.reverse();

    // Mark messages as delivered if sender is not current user
    const messageIdsToUpdate = messages
      .filter(msg => msg.sender._id.toString() !== user._id.toString() && msg.status === 'sent')
      .map(msg => msg._id);

    if (messageIdsToUpdate.length > 0) {
      await Message.updateMany(
        { _id: { $in: messageIdsToUpdate } },
        { status: 'delivered' }
      );
    }

    // Format messages for response
    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      conversationId: msg.conversationId,
      sender: {
        _id: msg.sender._id,
        fullName: msg.sender.fullName,
        profilePicture: msg.sender.profilePicture
      },
      content: msg.content,
      attachments: msg.attachments,
      status: msg.status,
      reactions: msg.reactions,
      replyTo: msg.replyTo ? {
        _id: msg.replyTo._id,
        content: msg.replyTo.content,
        sender: msg.replyTo.sender
      } : null,
      createdAt: msg.createdAt
    }));

    // Get next cursor (oldest message ID for next page)
    const nextCursor = messages.length > 0 ? messages[0]._id : null;

    return NextResponse.json({
      messages: formattedMessages,
      nextCursor,
      hasMore: messages.length === limit
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.id;
    const { content, attachments, replyToId } = await request.json();

    // Verify user is participant in conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: user._id
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Validate input
    if (!content && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: 'Message must have content or attachments' }, { status: 400 });
    }

    // Create message
    const message = new Message({
      conversationId,
      sender: user._id,
      content,
      attachments: attachments || [],
      replyTo: replyToId,
      status: 'sent'
    });

    await message.save();

    // Update conversation's lastMessage and lastActivity
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastActivity: new Date()
    });

    // Populate sender info
    await message.populate('sender', 'fullName profilePicture');

    return NextResponse.json({
      message: {
        _id: message._id,
        conversationId: message.conversationId,
        sender: {
          _id: message.sender._id,
          fullName: message.sender.fullName,
          profilePicture: message.sender.profilePicture
        },
        content: message.content,
        attachments: message.attachments,
        status: message.status,
        reactions: message.reactions,
        replyTo: message.replyTo,
        createdAt: message.createdAt
      }
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}