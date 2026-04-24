import { createServer } from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '4000', 10);

const MONGODB_URI = process.env.MONGODB_URI!;
const JWT_SECRET = process.env.JWT_SECRET!;

// ─── Mongoose Models ──────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema(
  { fullName: String, profilePicture: String, isBanned: { type: Boolean, default: false }, lastSeen: Date },
  { timestamps: true }
);
const User = mongoose.models.User || mongoose.model('User', userSchema);

const attachmentSchema = new mongoose.Schema({
  url: String, type: { type: String, enum: ['image', 'document'] }, fileName: String, fileSize: Number,
});
const reactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, emoji: String,
});
const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: String,
    attachments: [attachmentSchema],
    status: { type: String, enum: ['sent', 'delivered', 'seen'], default: 'sent' },
    reactions: [reactionSchema],
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    isSystemMessage: { type: Boolean, default: false },
  },
  { timestamps: true }
);
const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    type: { type: String, enum: ['dm', 'group'], default: 'dm' },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    lastActivity: { type: Date, default: Date.now },
    unreadCounts: { type: Map, of: Number, default: new Map() },
    name: String,
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);
const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    title: String, body: String, link: String,
    isRead: { type: Boolean, default: false },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    entityId: mongoose.Schema.Types.ObjectId,
    entityModel: String,
  },
  { timestamps: true }
);
const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

// ─── DB Connection ────────────────────────────────────────────────────────────

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });
  console.log('✅ MongoDB connected');
}

// ─── Socket.io Types ──────────────────────────────────────────────────────────

interface ServerToClientEvents {
  'message:new': (message: any) => void;
  'message:seen': (data: { conversationId: string; seenBy: string; upToMessageId: string }) => void;
  'message:deleted': (data: { messageId: string; conversationId: string }) => void;
  'typing:update': (data: { conversationId: string; userId: string; isTyping: boolean }) => void;
  'user:status': (data: { userId: string; isOnline: boolean; lastSeen: Date }) => void;
  'group:member_added': (data: { conversationId: string; addedUser: any }) => void;
  'group:member_removed': (data: { conversationId: string; removedUserId: string; removedBy: string }) => void;
  'notification:new': (notification: any) => void;
  error: (error: { code: string; message: string }) => void;
}

interface ClientToServerEvents {
  'message:send': (data: { conversationId: string; content?: string; attachments?: any[]; replyToId?: string }) => void;
  'message:seen': (data: { conversationId: string; messageId: string }) => void;
  'typing:start': (data: { conversationId: string }) => void;
  'typing:stop': (data: { conversationId: string }) => void;
  'conversation:open': (data: { conversationId: string }) => void;
}

interface SocketData { userId: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Get all member IDs for a conversation (DM participants or group members) */
async function getConversationMemberIds(conversationId: string): Promise<string[]> {
  const conv = await Conversation.findById(conversationId).lean();
  if (!conv) return [];
  const c = conv as any;
  if (c.type === 'group') return (c.members || []).map((m: any) => m.toString());
  return (c.participants || []).map((p: any) => p.toString());
}

/** Create a notification and emit it via socket */
async function createAndEmitNotification(
  io: SocketIOServer,
  params: { recipientId: string; type: string; actorId?: string; title: string; body: string; link: string; entityId?: string; entityModel?: string }
) {
  if (params.actorId && params.actorId === params.recipientId) return;
  try {
    const notification = await Notification.create({
      recipient: params.recipientId,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link,
      actor: params.actorId || undefined,
      entityId: params.entityId || undefined,
      entityModel: params.entityModel || undefined,
    });
    await notification.populate('actor', 'fullName profilePicture');
    io.to(`user:${params.recipientId}`).emit('notification:new', notification.toObject());
  } catch (err) {
    console.error('createAndEmitNotification error:', err);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  await connectDB();

  // ✅ THE FIX: create Express app and wrap it in an HTTP server
  const app = express();
  app.use(express.json());

  const httpServer = createServer(app);

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Expose io globally so Next.js API routes can emit notifications
  (global as any)._socketIO = io;

  // ─── Auth Middleware ──────────────────────────────────────────────────────

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) {
        socket.emit('error', { code: 'NO_TOKEN', message: 'Authentication token required' });
        return next(new Error('Authentication token required'));
      }
      let decoded: { userId: string };
      try {
        decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      } catch {
        socket.emit('error', { code: 'INVALID_TOKEN', message: 'Invalid or expired token' });
        return next(new Error('Invalid or expired token'));
      }
      const user = await User.findById(decoded.userId).lean();
      if (!user) {
        socket.emit('error', { code: 'USER_NOT_FOUND', message: 'User not found' });
        return next(new Error('User not found'));
      }
      if ((user as any).isBanned) {
        socket.emit('error', { code: 'USER_BANNED', message: 'Account is banned' });
        return next(new Error('User is banned'));
      }
      socket.data.userId = decoded.userId;
      next();
    } catch (err) {
      console.error('Socket auth error:', err);
      socket.emit('error', { code: 'AUTH_FAILED', message: 'Authentication failed' });
      next(new Error('Authentication failed'));
    }
  });

  // ─── Connection Handler ───────────────────────────────────────────────────

  io.on('connection', async (socket) => {
    const userId = socket.data.userId;
    console.log(`🔌 User ${userId} connected`);

    socket.join(`user:${userId}`);
    await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
    io.emit('user:status', { userId, isOnline: true, lastSeen: new Date() });

    // ── message:send ────────────────────────────────────────────────────────
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, content, attachments, replyToId } = data;

        if (!content && (!attachments || attachments.length === 0)) {
          socket.emit('error', { code: 'EMPTY_MESSAGE', message: 'Message must have content or attachments' });
          return;
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          socket.emit('error', { code: 'NOT_FOUND', message: 'Conversation not found' });
          return;
        }

        const c = conversation as any;
        const memberIds: string[] = c.type === 'group'
          ? (c.members || []).map((m: any) => m.toString())
          : (c.participants || []).map((p: any) => p.toString());

        if (!memberIds.includes(userId)) {
          socket.emit('error', { code: 'FORBIDDEN', message: 'Not a member of this conversation' });
          return;
        }

        const message = new Message({
          conversationId,
          sender: userId,
          content: content || undefined,
          attachments: attachments || [],
          replyTo: replyToId || undefined,
          status: 'sent',
        });
        await message.save();

        // Update conversation
        const incOps = Object.fromEntries(
          memberIds.filter((pid) => pid !== userId).map((pid) => [`unreadCounts.${pid}`, 1])
        );
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
          lastActivity: new Date(),
          $inc: incOps,
        });

        await message.populate('sender', 'fullName profilePicture');
        if (replyToId) {
          await message.populate({ path: 'replyTo', populate: { path: 'sender', select: 'fullName' } });
        }

        const messageObj = message.toObject();

        // Emit to all members
        memberIds.forEach((pid) => io.to(`user:${pid}`).emit('message:new', messageObj));

        // Notify offline members
        const onlineSockets = await io.fetchSockets();
        const onlineUserIds = new Set(onlineSockets.map((s) => (s.data as any).userId));

        const senderUser = await User.findById(userId).select('fullName').lean();
        const senderName = (senderUser as any)?.fullName || 'Someone';
        const convName = c.type === 'group' ? (c.name || 'Group') : senderName;

        await Promise.all(
          memberIds
            .filter((pid) => pid !== userId && !onlineUserIds.has(pid))
            .map((pid) =>
              createAndEmitNotification(io, {
                recipientId: pid,
                type: 'message',
                actorId: userId,
                title: `New message from ${convName}`,
                body: content ? content.slice(0, 80) : '📎 Attachment',
                link: '/dashboard/messages',
                entityId: conversationId,
                entityModel: 'Conversation',
              })
            )
        );
      } catch (err) {
        console.error('message:send error:', err);
        socket.emit('error', { code: 'SEND_FAILED', message: 'Failed to send message' });
      }
    });

    // ── message:seen ────────────────────────────────────────────────────────
    socket.on('message:seen', async (data) => {
      try {
        const { conversationId, messageId } = data;

        await Message.updateMany(
          { conversationId, sender: { $ne: userId }, _id: { $lte: messageId }, status: { $ne: 'seen' } },
          { status: 'seen' }
        );

        await Conversation.findByIdAndUpdate(conversationId, {
          $unset: { [`unreadCounts.${userId}`]: 1 },
        });

        const memberIds = await getConversationMemberIds(conversationId);
        memberIds
          .filter((pid) => pid !== userId)
          .forEach((pid) => {
            io.to(`user:${pid}`).emit('message:seen', { conversationId, seenBy: userId, upToMessageId: messageId });
          });
      } catch (err) {
        console.error('message:seen error:', err);
      }
    });

    // ── typing:start ────────────────────────────────────────────────────────
    socket.on('typing:start', async (data) => {
      try {
        const memberIds = await getConversationMemberIds(data.conversationId);
        memberIds.filter((pid) => pid !== userId).forEach((pid) => {
          io.to(`user:${pid}`).emit('typing:update', { conversationId: data.conversationId, userId, isTyping: true });
        });
      } catch (err) { console.error('typing:start error:', err); }
    });

    // ── typing:stop ─────────────────────────────────────────────────────────
    socket.on('typing:stop', async (data) => {
      try {
        const memberIds = await getConversationMemberIds(data.conversationId);
        memberIds.filter((pid) => pid !== userId).forEach((pid) => {
          io.to(`user:${pid}`).emit('typing:update', { conversationId: data.conversationId, userId, isTyping: false });
        });
      } catch (err) { console.error('typing:stop error:', err); }
    });

    // ── conversation:open ───────────────────────────────────────────────────
    socket.on('conversation:open', async (data) => {
      try {
        await Conversation.findByIdAndUpdate(data.conversationId, {
          $unset: { [`unreadCounts.${userId}`]: 1 },
        });
      } catch (err) { console.error('conversation:open error:', err); }
    });

    // ── disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`🔌 User ${userId} disconnected`);
      try {
        const lastSeen = new Date();
        await User.findByIdAndUpdate(userId, { lastSeen });
        io.emit('user:status', { userId, isOnline: false, lastSeen });
      } catch (err) { console.error('disconnect error:', err); }
    });
  });

  httpServer.listen(port, () => {
    console.log(`🚀 Socket server ready at http://${hostname}:${port}`);
  });
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});