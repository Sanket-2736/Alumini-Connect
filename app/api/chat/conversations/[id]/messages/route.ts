import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Message from "@/models/Message";
import Conversation from "@/models/Conversation";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    await connectDB();

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Pagination
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = 20;

    const query: any = { conversationId: id };

    if (cursor) {
      query._id = { $lt: cursor };
    }

    const messages = await Message.find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .populate("sender", "_id fullName profilePicture");

    const hasMore = messages.length === limit;
    const nextCursor = hasMore ? messages[messages.length - 1]._id : null;

    return NextResponse.json({
      messages: messages.reverse(),
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("GET messages error:", error);

    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
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

      const { id } = await context.params;   // ✅ correct

  const conversationId = id;
;
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