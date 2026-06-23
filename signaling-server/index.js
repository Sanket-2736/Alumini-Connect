const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Store active rooms and their participants
const rooms = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Room status endpoint
app.get('/room-status', (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId required' });
  }

  const room = rooms.get(sessionId);
  res.json({
    sessionId,
    active: !!room,
    participantCount: room ? room.participants.size : 0,
    participants: room ? Array.from(room.participants.values()).map(p => ({
      id: p.id,
      role: p.role,
      displayName: p.displayName,
    })) : [],
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);

  // Join room
  socket.on('join-room', (data) => {
    const { sessionId, role, displayName, userId } = data;

    if (!sessionId || !role || !displayName) {
      socket.emit('error', { message: 'Missing required fields' });
      return;
    }

    // Create room if it doesn't exist
    if (!rooms.has(sessionId)) {
      rooms.set(sessionId, {
        participants: new Map(),
        createdAt: new Date(),
      });
    }

    const room = rooms.get(sessionId);
    room.participants.set(socket.id, {
      id: socket.id,
      role,
      displayName,
      userId,
    });

    socket.join(sessionId);
    console.log(`[Room] ${displayName} (${role}) joined ${sessionId}`);

    // Notify others in room
    socket.to(sessionId).emit('user-joined', {
      userId: socket.id,
      role,
      displayName,
    });

    // Send current participants to the new user
    const participants = Array.from(room.participants.values());
    socket.emit('room-participants', { participants });

    // If both participants are present, notify initiator
    if (room.participants.size === 2) {
      io.to(sessionId).emit('ready-to-call', {
        message: 'Both participants are ready',
        participants: participants,
      });
    }
  });

  // Handle WebRTC offer
  socket.on('call-user', (data) => {
    const { to, offer, sessionId } = data;
    socket.to(sessionId).emit('call-received', {
      from: socket.id,
      offer,
    });
    console.log(`[Call] Offer sent in room ${sessionId}`);
  });

  // Handle WebRTC answer
  socket.on('call-accepted', (data) => {
    const { to, answer, sessionId } = data;
    socket.to(sessionId).emit('call-answer', {
      from: socket.id,
      answer,
    });
    console.log(`[Call] Answer sent in room ${sessionId}`);
  });

  // Handle ICE candidates
  socket.on('ice-candidate', (data) => {
    const { candidate, sessionId } = data;
    socket.to(sessionId).emit('ice-candidate', {
      from: socket.id,
      candidate,
    });
  });

  // Handle chat messages
  socket.on('chat-message', (data) => {
    const { sessionId, message, timestamp } = data;
    socket.to(sessionId).emit('chat-message', {
      from: socket.id,
      message,
      timestamp,
    });
    console.log(`[Chat] Message in room ${sessionId}`);
  });

  // Handle call end
  socket.on('end-call', (data) => {
    const { sessionId } = data;
    socket.to(sessionId).emit('call-ended', {
      from: socket.id,
      reason: data.reason || 'User ended the call',
    });
    console.log(`[Call] Ended in room ${sessionId}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket] User disconnected: ${socket.id}`);

    // Find and clean up room
    for (const [sessionId, room] of rooms.entries()) {
      if (room.participants.has(socket.id)) {
        const participant = room.participants.get(socket.id);
        room.participants.delete(socket.id);

        // Notify others
        io.to(sessionId).emit('user-left', {
          userId: socket.id,
          displayName: participant.displayName,
        });

        // Clean up empty rooms after 5 minutes
        if (room.participants.size === 0) {
          setTimeout(() => {
            if (rooms.get(sessionId)?.participants.size === 0) {
              rooms.delete(sessionId);
              console.log(`[Room] Cleaned up empty room: ${sessionId}`);
            }
          }, 5 * 60 * 1000);
        }
      }
    }
  });
});

const PORT = process.env.SIGNALING_SERVER_PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Signaling server running on port ${PORT}`);
  console.log(`📡 CORS enabled for: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`);
});
