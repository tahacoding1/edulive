const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const OTP    = require('../models/OTP');
const auth   = require('../middleware/auth');
const { sendOTP } = require('../utils/mailer');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register — default role: student
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (await User.findOne({ email }))
      return res.status(409).json({ message: 'Email already registered' });

    const user  = await User.create({ name, email, password });
    const token = signToken(user._id);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });
    if (!user.isActive)
      return res.status(403).json({ message: 'Account deactivated. Contact admin.' });

    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => res.json({ user: req.user }));

// POST /api/auth/forgot-password — send OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });

    const otp       = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.deleteMany({ email });
    await OTP.create({ email, otp, expiresAt });
    await sendOTP(email, otp);

    res.json({ message: 'OTP sent to your email address' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send OTP. Check server mail configuration.', error: err.message });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = await OTP.findOne({ email, otp, used: false });
    if (!record || record.expiresAt < new Date())
      return res.status(400).json({ message: 'Invalid or expired OTP' });

    record.used = true;
    await record.save();

    const resetToken = jwt.sign(
      { email, purpose: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    res.json({ resetToken });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    if (decoded.purpose !== 'reset')
      return res.status(400).json({ message: 'Invalid reset token' });

    const user = await User.findOne({ email: decoded.email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(400).json({ message: 'Reset session expired. Request a new OTP.' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
