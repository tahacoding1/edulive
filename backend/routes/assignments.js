const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Assignment = require('../models/Assignment');
const Room = require('../models/Room');
const authMiddleware = require('../middleware/auth');

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/submissions');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|doc|docx|jpg|jpeg|png|zip|txt/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    allowed.test(ext) ? cb(null, true) : cb(new Error('File type not allowed'));
  },
});

// GET /api/assignments/:roomId  — list assignments for a room
router.get('/:roomId', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const assignments = await Assignment.find({ room: room._id })
      .populate('teacher', 'name')
      .populate('submissions.student', 'name email')
      .sort({ createdAt: -1 });

    res.json({ assignments });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/assignments/:roomId  — create assignment (teacher only)
router.post('/:roomId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'teacher')
      return res.status(403).json({ message: 'Only teachers can post assignments' });

    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const { title, description, deadline } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });

    const assignment = await Assignment.create({
      room: room._id,
      teacher: req.user._id,
      title: title.trim(),
      description: description?.trim(),
      deadline: deadline ? new Date(deadline) : undefined,
    });
    await assignment.populate('teacher', 'name');

    res.status(201).json({ assignment });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/assignments/:assignmentId/submit  — student submits file
router.post('/:assignmentId/submit', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (req.user.role !== 'student')
      return res.status(403).json({ message: 'Only students can submit assignments' });

    if (!req.file) return res.status(400).json({ message: 'File is required' });

    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    // Remove previous submission by same student if exists
    assignment.submissions = assignment.submissions.filter(
      s => s.student.toString() !== req.user._id.toString()
    );

    assignment.submissions.push({
      student: req.user._id,
      fileName: req.file.originalname,
      filePath: req.file.path,
    });
    await assignment.save();
    await assignment.populate('submissions.student', 'name email');

    res.json({ assignment });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/assignments/teacher/all — all assignments teacher created
router.get('/teacher/all', authMiddleware, async (req, res) => {
  try {
    if (!['teacher','admin'].includes(req.user.role))
      return res.status(403).json({ message: 'Teachers only' });
    const assignments = await Assignment.find({ teacher: req.user._id })
      .populate('room', 'name roomId')
      .populate('submissions.student', 'name email')
      .sort({ createdAt: -1 });
    res.json({ assignments });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/assignments/student/all — all assignments for rooms student joined
router.get('/student/all', authMiddleware, async (req, res) => {
  try {
    // Find all rooms where this student is a participant
    const rooms = await Room.find({ participants: req.user._id });
    const roomIds = rooms.map(r => r._id);

    const assignments = await Assignment.find({ room: { $in: roomIds } })
      .populate('room', 'name roomId')
      .populate('teacher', 'name')
      .populate('submissions.student', 'name email')
      .sort({ createdAt: -1 });

    // Annotate each with roomName for convenience
    const annotated = assignments.map(a => ({
      ...a.toObject(),
      roomName: a.room?.name,
      roomId:   a.room?.roomId,
    }));

    res.json({ assignments: annotated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
