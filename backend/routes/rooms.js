const router = require('express').Router();
const Room   = require('../models/Room');
const auth   = require('../middleware/auth');
const { sendClassCreated } = require('../utils/mailer');

// POST /api/rooms
router.post('/', auth, async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role))
      return res.status(403).json({ message: 'Only teachers can create rooms' });

    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Classroom name is required' });

    const room = await Room.create({ name: name.trim(), teacher: req.user._id });
    await room.populate('teacher', 'name email');

    // Send email to teacher (non-blocking)
    sendClassCreated(
      req.user.email, req.user.name,
      room.name, room.roomId, room.password
    ).catch(e => console.error('Mail error:', e.message));

    res.status(201).json({ room });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/rooms/join
router.post('/join', auth, async (req, res) => {
  try {
    const { roomId, password } = req.body;
    if (!roomId || !password)
      return res.status(400).json({ message: 'Room ID and password are required' });

    const room = await Room.findOne({ roomId: roomId.trim().toUpperCase() })
      .populate('teacher', 'name email');

    if (!room || room.password !== password.trim())
      return res.status(401).json({ message: 'Invalid Room ID or password' });

    if (!room.participants.includes(req.user._id)) {
      room.participants.push(req.user._id);
      await room.save();
    }

    res.json({ room });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/rooms/all  — admin only
router.get('/all', auth, async (req, res) => {
  try {
    if (!['admin','teacher'].includes(req.user.role))
      return res.status(403).json({ message: 'Admin only' });

    const filter = req.user.role === 'admin' ? {} : { teacher: req.user._id };
    const rooms = await Room.find(filter)
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });
    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/rooms/:roomId
router.get('/:roomId', auth, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId })
      .populate('teacher', 'name email')
      .populate('participants', 'name email role');
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json({ room });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/rooms/:roomId/end
router.patch('/:roomId/end', auth, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Unauthorized' });

    room.isActive = false;
    await room.save();
    res.json({ message: 'Session ended' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/rooms/:roomId/participants/:userId
router.delete('/:roomId/participants/:userId', auth, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.teacher.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Unauthorized' });

    room.participants = room.participants.filter(p => p.toString() !== req.params.userId);
    await room.save();
    res.json({ message: 'Participant removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;

// GET /api/rooms/teacher/mine — teacher sees their own rooms
router.get('/teacher/mine', auth, async (req, res) => {
  try {
    if (!['teacher','admin'].includes(req.user.role))
      return res.status(403).json({ message: 'Teachers only' });
    const rooms = await Room.find({ teacher: req.user._id })
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });
    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
