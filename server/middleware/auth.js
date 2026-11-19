// Access control: checks the login token and the user's role
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Any logged-in user
async function login(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Please login first' });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return res.status(401).json({ message: 'Session expired. Please login again.' });
  }

  // The account may have been deleted after the token was made
  const user = await User.findById(payload.id).select('role');
  if (!user) return res.status(401).json({ message: 'Account no longer exists' });

  req.user = { id: String(user._id), role: user.role }; // role comes from the database
  next();
}

// Only the warden/admin
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can do this' });
  }
  next();
}

// Only students
function studentOnly(req, res, next) {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Only students can do this' });
  }
  next();
}

module.exports = { login, adminOnly, studentOnly };
