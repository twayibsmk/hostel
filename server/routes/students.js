// Student management (admin only)
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Room = require('../models/Room');
const Fee = require('../models/Fee');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const { Attendance } = require('../models/Mess');
const { login, adminOnly } = require('../middleware/auth');
const { isId, cleanStudent, checkStudent } = require('../utils/validate');

const router = express.Router();
router.use(login, adminOnly); // every route below needs admin

// Reject bad ids like /students/abc
router.param('id', (req, res, next, id) => {
  if (!isId(id)) return res.status(400).json({ message: 'Invalid id' });
  next();
});

// List all students
router.get('/', async (req, res) => {
  const students = await User.find({ role: 'student' }).select('-password').populate('room', 'roomNo block');
  res.json(students);
});

// Add a student
router.post('/', async (req, res) => {
  const data = cleanStudent(req.body);
  const error = checkStudent(data, true);
  if (error) return res.status(400).json({ message: error });

  const password = req.body.password ? String(req.body.password) : 'student123'; // default password
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

  if (await User.findOne({ email: data.email })) return res.status(400).json({ message: 'Email already exists' });
  if (data.rollNo && (await User.findOne({ rollNo: data.rollNo }))) {
    return res.status(400).json({ message: 'Roll number already exists' });
  }

  const student = await User.create({ ...data, password: await bcrypt.hash(password, 10), role: 'student' });
  res.json({ _id: student._id, name: student.name, email: student.email });
});

// Edit a student (email, password, role and room cannot be changed here)
router.put('/:id', async (req, res) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const data = cleanStudent(req.body);
  delete data.email;
  const error = checkStudent(data, false);
  if (error) return res.status(400).json({ message: error });

  if (data.rollNo && (await User.findOne({ rollNo: data.rollNo, _id: { $ne: student._id } }))) {
    return res.status(400).json({ message: 'Roll number already exists' });
  }

  Object.assign(student, data);
  await student.save();
  res.json({ _id: student._id, name: student.name });
});

// Forgot password: admin resets it to the default
router.put('/:id/reset-password', async (req, res) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) return res.status(404).json({ message: 'Student not found' });
  student.password = await bcrypt.hash('student123', 10);
  await student.save();
  res.json({ message: 'Password reset to student123' });
});

// Delete a student: also removes him from his room and deletes his own records
router.delete('/:id', async (req, res) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) return res.status(404).json({ message: 'Student not found' });

  await Room.updateMany({ occupants: student._id }, { $pull: { occupants: student._id } });
  await Fee.deleteMany({ student: student._id });
  await Complaint.deleteMany({ student: student._id });
  await Attendance.deleteMany({ student: student._id });
  await Notification.deleteMany({ user: student._id });
  await student.deleteOne();
  res.json({ message: 'Student deleted' });
});

module.exports = router;
