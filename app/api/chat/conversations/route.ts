import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Connection from '@/models/Connection';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch both DMs (participants) and groups (members)
    const conversations = await Conversation.find({
      $or: [{ participants: user._id }, { members: user._id }],
      isArchived: { $ne: true },
    })
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'fullName profilePicture' },
      })
      .sort({ lastActivity: -1 })
      .lean();

    // Populate participants for DMs only
    const dmIds = conversations.filter((c) => c.type === 'dm').map((c) => c._id);
    const populatedDMs = await Conversation.find({ _id: { $in: dmIds } })
      .populate({
        path: 'participants',
        select: 'fullName profilePicture lastSeen',
        match: { _id: { $ne: user._id } },
      })
      .lean();

    const dmMap = new Map(populatedDMs.map((c) => [c._id.toString(), c]));

    const formatted = conversations.map((conv) => {
      const unreadCount = (conv.unreadCounts as any)?.get
        ? (conv.unreadCounts as any).get(user._id.toString()) || 0
        : (conv.unreadCounts as any)?.[user._id.toString()] || 0;

      const lastMsg = conv.lastMessage
        ? {
            _id: (conv.lastMessage as any)._id,
            content: (conv.lastMessage as any).content,
            attachments: (conv.lastMessage as any).attachments,
            sender: (conv.lastMessage as any).sender,
            createdAt: (conv.lastMessage as any).createdAt,
          }
        : null;

      if (conv.type === 'dm') {
        const populated = dmMap.get(conv._id.toString());
        const other = populated?.participants?.[0] as any;
        return {
          _id: conv._id,
          type: 'dm',
          otherParticipant: other
            ? {
                _id: other._id,
                fullName: other.fullName,
                profilePicture: other.profilePicture,
                lastSeen: other.lastSeen,
              }
            : null,
          lastMessage: lastMsg,
          lastActivity: conv.lastActivity,
          unreadCount,
          createdAt: conv.createdAt,
        };
      } else {
        // Group
        return {
          _id: conv._id,
          type: 'group',
          name: conv.name,
          description: conv.description,
          groupAvatar: conv.groupAvatar,
          groupType: conv.groupType,
          memberCount: conv.members?.length || 0,
          admins: conv.admins,
          lastMessage: lastMsg,
          lastActivity: conv.lastActivity,
          unreadCount,
          createdAt: conv.createdAt,
        };
      }
    });

    return NextResponse.json({ conversations: formatted.filter((c) => c.otherParticipant !== null || c.type === 'group') });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { recipientId } = await request.json();
    if (!recipientId) return NextResponse.json({ error: 'Recipient ID is required' }, { status: 400 });

    const connection = await Connection.findOne({
      $or: [
        { requester: user._id, recipient: recipientId, status: 'accepted' },
        { requester: recipientId, recipient: user._id, status: 'accepted' },
      ],
    });

    if (!connection) {
      return NextResponse.json({ error: 'Users must be connected to start a conversation' }, { status: 403 });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [user._id, recipientId], $size: 2 },
      type: 'dm',
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [user._id, recipientId],
        type: 'dm',
        lastActivity: new Date(),
      });
      await conversation.save();
    }

    await conversation.populate({
      path: 'participants',
      select: 'fullName profilePicture lastSeen',
      match: { _id: { $ne: user._id } },
    });

    const other = (conversation.participants as any[])[0];

    return NextResponse.json({
      conversation: {
        _id: conversation._id,
        type: 'dm',
        otherParticipant: {
          _id: other._id,
          fullName: other.fullName,
          profilePicture: other.profilePicture,
          lastSeen: other.lastSeen,
        },
        lastActivity: conversation.lastActivity,
        unreadCount: 0,
        createdAt: conversation.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
