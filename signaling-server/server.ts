import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

interface RoomParticipant {
  socketId: string;
  userId: string;
  displayName: string;
  role: 'initiator' | 'participant';
  joinedAt: number;
}

interface Room {
  participants: Map<string, RoomParticipant>;
  createdAt: number;
  sessionId: string;
}

const rooms = new Map<string, Room>();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/room-status', (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'sessionId required' });
  }

  const room = rooms.get(sessionId);
  const active = room && room.participants.size > 0;

  res.json({
    sessionId,
    active,
    participantCount: room?.participants.size || 0,
    participants: room
      ? Array.from(room.participants.values()).map(p => ({
          userId: p.userId,
          displayName: p.displayName,
          role: p.role,
        }))
      : [],
  });
});

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on('join-room', (data: { sessionId: string; userId: string; displayName: string; role: 'initiator' | 'participant' }) => {
    const { sessionId, userId, displayName, role } = data;

    console.log(`[Room] ${userId} (${role}) joining room ${sessionId}`);

    if (!rooms.has(sessionId)) {
      rooms.set(sessionId, {
        participants: new Map(),
        createdAt: Date.now(),
        sessionId,
      });
    }

    const room = rooms.get(sessionId)!;

    room.participants.set(socket.id, {
      socketId: socket.id,
      userId,
      displayName,
      role,
      joinedAt: Date.now(),
    });

    socket.join(sessionId);

    io.to(sessionId).emit('user-joined', {
      socketId: socket.id,
      userId,
      displayName,
      role,
      participantCount: room.participants.size,
    });

    if (room.participants.size === 2) {
      const initiator = Array.from(room.participants.values()).find(p => p.role === 'initiator');
      if (initiator) {
        io.to(initiator.socketId).emit('ready-to-call', {
          participantCount: room.participants.size,
        });
      }
    }

    console.log(`[Room] ${sessionId} now has ${room.participants.size} participants`);
  });

  socket.on('call-user', (data: { to: string; offer: any }) => {
    console.log(`[Call] Offer sent from ${socket.id} to ${data.to}`);
    io.to(data.to).emit('incoming-call', {
      from: socket.id,
      offer: data.offer,
    });
  });

  socket.on('call-accepted', (data: { to: string; answer: any }) => {
    console.log(`[Call] Answer sent from ${socket.id} to ${data.to}`);
    io.to(data.to).emit('call-accepted', {
      from: socket.id,
      answer: data.answer,
    });
  });

  socket.on('ice-candidate', (data: { to: string; candidate: any }) => {
    io.to(data.to).emit('ice-candidate', {
      from: socket.id,
      candidate: data.candidate,
    });
  });

  socket.on('chat-message', (data: { sessionId: string; message: string; timestamp: number }) => {
    const room = rooms.get(data.sessionId);
    if (room) {

      socket.to(data.sessionId).emit('chat-message', {
        from: socket.id,
        message: data.message,
        timestamp: data.timestamp,
      });
    }
  });

  socket.on('end-call', (data: { sessionId: string }) => {
    const room = rooms.get(data.sessionId);
    if (room) {
      room.participants.delete(socket.id);
      io.to(data.sessionId).emit('call-ended', {
        from: socket.id,
      });

      if (room.participants.size === 0) {
        rooms.delete(data.sessionId);
        console.log(`[Room] Deleted empty room ${data.sessionId}`);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);

    for (const [sessionId, room] of rooms.entries()) {
      if (room.participants.has(socket.id)) {
        room.participants.delete(socket.id);
        io.to(sessionId).emit('user-left', {
          socketId: socket.id,
          participantCount: room.participants.size,
        });

        if (room.participants.size === 0) {
          rooms.delete(sessionId);
          console.log(`[Room] Deleted empty room ${sessionId}`);
        }
      }
    }
  });
});

const PORT = process.env.PORT || process.env.SIGNALING_SERVER_PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Signaling server running on port ${PORT}`);
  console.log(
    `📡 CORS enabled for: ${
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    }`
  );
});
