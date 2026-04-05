const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const Message = require('../models/Message');
const Room    = require('../models/Room');

// roomId -> Map<userId, { socketId, userId, name, role }>
const roomParticipants = new Map();
// socketId -> { roomId, userId, name, role }
const socketMap = new Map();
// roomId -> Set<userId>
const raisedHands = new Map();

module.exports = (io) => {

  // ── Auth middleware ──
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch { next(new Error('Invalid token')); }
  });

  io.on('connection', (socket) => {

    // ── JOIN ROOM ──
    socket.on('join-room', async ({ roomId }) => {
      try {
        const room = await Room.findOne({ roomId }).populate('teacher', 'name');
        if (!room || !room.isActive) {
          socket.emit('error', { message: 'Room not found or has ended' }); return;
        }
        socket.join(roomId);

        const participant = {
          socketId: socket.id,
          userId:   socket.user._id.toString(),
          name:     socket.user.name,
          role:     socket.user.role,
        };

        if (!roomParticipants.has(roomId)) roomParticipants.set(roomId, new Map());
        roomParticipants.get(roomId).set(socket.user._id.toString(), participant);
        socketMap.set(socket.id, { roomId, ...participant });

        const participants = Array.from(roomParticipants.get(roomId).values());
        const hands        = raisedHands.has(roomId) ? Array.from(raisedHands.get(roomId)) : [];

        socket.emit('room-state', { participants, raisedHands: hands });
        socket.to(roomId).emit('participant-joined', { participant, participants });

        // Chat history (last 80 msgs)
        const recentMsgs = await Message.find({ room: room._id })
          .populate('sender', 'name role')
          .sort({ createdAt: -1 }).limit(80);
        socket.emit('chat-history', { messages: recentMsgs.reverse() });

        // Tell existing peers to initiate WebRTC offers to this new user
        socket.to(roomId).emit('webrtc-new-peer', {
          peerId:   socket.user._id.toString(),
          peerName: socket.user.name,
          socketId: socket.id,
        });

      } catch (err) { socket.emit('error', { message: 'Failed to join room' }); }
    });

    // ── CHAT ──
    socket.on('send-message', async ({ roomId, text }) => {
      if (!text?.trim()) return;
      const room = await Room.findOne({ roomId });
      if (!room) return;
      const message = await Message.create({ room: room._id, sender: socket.user._id, text: text.trim() });
      await message.populate('sender', 'name role');
      io.to(roomId).emit('new-message', { message });
    });

    // ── WHITEBOARD ──
    socket.on('whiteboard-draw',  ({ roomId, stroke }) =>
      socket.to(roomId).emit('whiteboard-draw', { stroke }));
    socket.on('whiteboard-clear', ({ roomId }) => {
      if (socket.user.role !== 'teacher' && socket.user.role !== 'admin') return;
      io.to(roomId).emit('whiteboard-clear');
    });
    socket.on('whiteboard-undo',  ({ roomId }) => {
      if (socket.user.role !== 'teacher' && socket.user.role !== 'admin') return;
      io.to(roomId).emit('whiteboard-undo');
    });

    // ── RAISE / LOWER HAND ──
    socket.on('raise-hand', ({ roomId, raised }) => {
      if (!raisedHands.has(roomId)) raisedHands.set(roomId, new Set());
      raised
        ? raisedHands.get(roomId).add(socket.user._id.toString())
        : raisedHands.get(roomId).delete(socket.user._id.toString());

      io.to(roomId).emit('hand-update', {
        userId: socket.user._id.toString(), name: socket.user.name, raised,
        raisedHands: Array.from(raisedHands.get(roomId) || []),
      });
    });

    socket.on('allow-speak', ({ roomId, userId }) => {
      if (socket.user.role !== 'teacher' && socket.user.role !== 'admin') return;
      raisedHands.get(roomId)?.delete(userId);
      io.to(roomId).emit('speak-allowed', {
        userId, raisedHands: Array.from(raisedHands.get(roomId) || []),
      });
    });

    // ── REMOVE PARTICIPANT ──
    socket.on('remove-participant', ({ roomId, userId }) => {
      if (socket.user.role !== 'teacher' && socket.user.role !== 'admin') return;
      const target = roomParticipants.get(roomId)?.get(userId);
      if (target) {
        io.to(target.socketId).emit('kicked', { message: 'You have been removed from the classroom.' });
        roomParticipants.get(roomId).delete(userId);
      }
      io.to(roomId).emit('participant-removed', {
        userId, participants: Array.from(roomParticipants.get(roomId)?.values() || []),
      });
    });

    // ── END ROOM ──
    socket.on('end-room', async ({ roomId }) => {
      if (socket.user.role !== 'teacher' && socket.user.role !== 'admin') return;
      await Room.findOneAndUpdate({ roomId }, { isActive: false });
      io.to(roomId).emit('room-ended', { message: 'The teacher has ended this session.' });
      roomParticipants.delete(roomId);
      raisedHands.delete(roomId);
    });

    // ══════════════════════════════════════
    // WebRTC SIGNALING
    // ══════════════════════════════════════

    // Relay offer from caller to specific target socket
    socket.on('webrtc-offer', ({ targetSocketId, offer, senderInfo }) => {
      io.to(targetSocketId).emit('webrtc-offer', {
        offer,
        senderSocketId: socket.id,
        senderInfo,
      });
    });

    // Relay answer back to caller
    socket.on('webrtc-answer', ({ targetSocketId, answer }) => {
      io.to(targetSocketId).emit('webrtc-answer', {
        answer,
        senderSocketId: socket.id,
      });
    });

    // Relay ICE candidate
    socket.on('webrtc-ice-candidate', ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit('webrtc-ice-candidate', {
        candidate,
        senderSocketId: socket.id,
      });
    });

    // Notify room when someone toggles their stream (mic/camera)
    socket.on('webrtc-stream-toggle', ({ roomId, hasVideo, hasAudio }) => {
      socket.to(roomId).emit('webrtc-stream-toggle', {
        userId:   socket.user._id.toString(),
        socketId: socket.id,
        name:     socket.user.name,
        hasVideo,
        hasAudio,
      });
    });

    // ── DISCONNECT ──
    socket.on('disconnect', () => {
      const info = socketMap.get(socket.id);
      if (info) {
        const { roomId, userId } = info;
        roomParticipants.get(roomId)?.delete(userId);
        raisedHands.get(roomId)?.delete(userId);
        const list = Array.from(roomParticipants.get(roomId)?.values() || []);
        if (list.length === 0) roomParticipants.delete(roomId);
        socket.to(roomId).emit('participant-left', { userId, name: socket.user.name, participants: list });
        // Tell peers to close their connection to this socket
        socket.to(roomId).emit('webrtc-peer-left', { socketId: socket.id, userId });
        socketMap.delete(socket.id);
      }
    });
  });
};
