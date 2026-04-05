const router  = require('express').Router();
const User    = require('../models/User');
const Room    = require('../models/Room');
const Message = require('../models/Message');
const Assignment = require('../models/Assignment');
const Content = require('../models/Content');
const auth    = require('../middleware/auth');

// Admin guard middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'Admin access required' });
  next();
};

// GET /api/admin/stats
router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const [users, rooms, messages, assignments] = await Promise.all([
      User.countDocuments(),
      Room.countDocuments(),
      Message.countDocuments(),
      Assignment.countDocuments(),
    ]);
    const roleBreakdown = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    res.json({ users, rooms, messages, assignments, roleBreakdown });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/admin/users
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role = '' } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);
    res.json({ users, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', auth, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'teacher', 'admin'].includes(role))
      return res.status(400).json({ message: 'Invalid role' });

    const user = await User.findByIdAndUpdate(
      req.params.id, { role }, { new: true, select: '-password' }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/admin/users/:id/toggle-active
router.patch('/users/:id/toggle-active', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ message: 'Cannot delete your own account' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/admin/rooms — all rooms with stats
router.get('/rooms', auth, adminOnly, async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── Content CMS ──

// GET /api/admin/content  — all sections
router.get('/content', auth, adminOnly, async (req, res) => {
  try {
    const items = await Content.find();
    const content = {};
    items.forEach(i => { content[i.section] = i.data; });
    res.json({ content });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/admin/content/:section  — upsert a section
router.put('/content/:section', auth, adminOnly, async (req, res) => {
  try {
    const { data } = req.body;
    const item = await Content.findOneAndUpdate(
      { section: req.params.section },
      { data },
      { upsert: true, new: true }
    );
    res.json({ content: item });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
