const router = require('express').Router();
const Message = require('../models/Message');
const Room = require('../models/Room');
const authMiddleware = require('../middleware/auth');

// GET /api/messages/:roomId  — fetch last 100 messages for a room
router.get('/:roomId', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const messages = await Message.find({ room: room._id })
      .populate('sender', 'name role')
      .sort({ createdAt: 1 })
      .limit(100);

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/messages/:roomId  — save a message (also emitted via Socket.io)
router.post('/:roomId', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Message text required' });

    const message = await Message.create({
      room: room._id,
      sender: req.user._id,
      text: text.trim(),
    });
    await message.populate('sender', 'name role');

    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
