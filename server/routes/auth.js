const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { login } = require('../middleware/auth');
const { checkBlocked, recordFail, recordSuccess } = require('../middleware/rateLimit');
const { cleanStudent, checkStudent } = require('../utils/validate');

const router = express.Router();

function makeToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// Student registers himself (role is always "student" here)
router.post('/register', async (req, res) => {
  const data = cleanStudent(req.body);
  const password = String(req.body.password || '');

  const error = checkStudent(data, true);
  if (error) return res.status(400).json({ message: error });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

  if (await User.findOne({ email: data.email })) {
    return res.status(400).json({ message: 'Email already registered' });
  }
  if (data.rollNo && (await User.findOne({ rollNo: data.rollNo }))) {
    return res.status(400).json({ message: 'Roll number already registered' });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ ...data, password: hash, role: 'student' });
  res.json({ token: makeToken(user), user: { id: user._id, name: user.name, role: user.role } });
});

router.post('/login', checkBlocked, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = await User.findOne({ email });
  const ok = user && (await bcrypt.compare(String(req.body.password || ''), user.password));
  if (!ok) {
    recordFail(req);
    return res.status(400).json({ message: 'Wrong email or password' }); // same message for both, on purpose
  }
  recordSuccess(req);
  res.json({ token: makeToken(user), user: { id: user._id, name: user.name, role: user.role } });
});

// Details of the logged-in user
router.get('/me', login, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password').populate('room');
  res.json(user);
});

// Change my own password
router.post('/change-password', login, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }
  const user = await User.findById(req.user.id);
  if (!(await bcrypt.compare(String(oldPassword || ''), user.password))) {
    return res.status(400).json({ message: 'Old password is wrong' });
  }
  user.password = await bcrypt.hash(String(newPassword), 10);
  await user.save();
  res.json({ message: 'Password changed' });
});

module.exports = router;
