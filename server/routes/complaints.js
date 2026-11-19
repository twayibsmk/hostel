// Complaints / maintenance requests
const express = require('express');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const { login, adminOnly, studentOnly } = require('../middleware/auth');
const { isId } = require('../utils/validate');

const router = express.Router();
router.use(login);

const CATEGORIES = ['Electrical', 'Plumbing', 'Furniture', 'Cleaning', 'Internet', 'Other'];
const STATUSES = ['Open', 'In Progress', 'Resolved'];
const MAX_OPEN = 5; // a student can have at most 5 unresolved complaints (stops spam)

router.param('id', (req, res, next, id) => {
  if (!isId(id)) return res.status(400).json({ message: 'Invalid id' });
  next();
});

router.get('/', async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { student: req.user.id };
  const list = await Complaint.find(filter).sort('-createdAt').populate('student', 'name rollNo room');
  res.json(list);
});

// Student raises a complaint
router.post('/', studentOnly, async (req, res) => {
  const category = req.body.category || 'Other';
  const description = String(req.body.description || '').trim();

  if (!CATEGORIES.includes(category)) return res.status(400).json({ message: 'Invalid category' });
  if (description.length < 5) return res.status(400).json({ message: 'Please describe the problem (at least 5 characters)' });
  if (description.length > 500) return res.status(400).json({ message: 'Description is too long (max 500 characters)' });

  const openCount = await Complaint.countDocuments({ student: req.user.id, status: { $ne: 'Resolved' } });
  if (openCount >= MAX_OPEN) return res.status(400).json({ message: 'You already have ' + MAX_OPEN + ' unresolved complaints. Please wait for them to be resolved.' });

  const complaint = await Complaint.create({ student: req.user.id, category, description });
  res.json(complaint);
});

// Admin changes the status
router.put('/:id', adminOnly, async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid status' });

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
  if (complaint.status === status) return res.json(complaint); // nothing changed, no extra notification

  complaint.status = status;
  complaint.resolvedAt = status === 'Resolved' ? new Date() : undefined; // cleared if reopened
  await complaint.save();

  await Notification.send(complaint.student, 'Your ' + complaint.category + ' complaint is now: ' + status);
  res.json(complaint);
});

module.exports = router;
