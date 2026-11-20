const express = require('express');
const Notification = require('../models/Notification');
const { login } = require('../middleware/auth');

const router = express.Router();
router.use(login);

// My notifications (newest first)
router.get('/', async (req, res) => {
  res.json(await Notification.find({ user: req.user.id }).sort('-createdAt').limit(50));
});

// Mark all as read
router.put('/read-all', async (req, res) => {
  await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
  res.json({ message: 'Done' });
});

module.exports = router;
