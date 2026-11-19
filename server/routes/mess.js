// Mess management: weekly menu + meal opt-in
const express = require('express');
const { Menu, Attendance } = require('../models/Mess');
const { login, adminOnly, studentOnly } = require('../middleware/auth');
const { isDateText } = require('../utils/validate');

const router = express.Router();
router.use(login);

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEALS = ['Breakfast', 'Lunch', 'Dinner'];

// Everyone can see the menu
router.get('/menu', async (req, res) => {
  res.json(await Menu.find());
});

// Admin sets the menu for a day + meal (creates it or updates it)
router.put('/menu', adminOnly, async (req, res) => {
  const { day, meal } = req.body;
  const items = String(req.body.items || '').trim();
  if (!DAYS.includes(day)) return res.status(400).json({ message: 'Invalid day' });
  if (!MEALS.includes(meal)) return res.status(400).json({ message: 'Invalid meal' });
  if (!items || items.length > 200) return res.status(400).json({ message: 'Items are required (max 200 characters)' });

  const row = await Menu.findOneAndUpdate({ day, meal }, { items }, { new: true, upsert: true });
  res.json(row);
});

// Student: meals I have opted in for a date
router.get('/attendance/me', studentOnly, async (req, res) => {
  if (!isDateText(req.query.date)) return res.status(400).json({ message: 'Invalid date' });
  res.json(await Attendance.find({ student: req.user.id, date: req.query.date }));
});

// Student: opt in / opt out of a meal (calling it again toggles)
router.post('/attendance', studentOnly, async (req, res) => {
  const { date, meal } = req.body;
  if (!isDateText(date)) return res.status(400).json({ message: 'Invalid date' });
  if (!MEALS.includes(meal)) return res.status(400).json({ message: 'Invalid meal' });

  // Allowed: from yesterday (covers time zone difference) up to 14 days ahead
  const day = 24 * 60 * 60 * 1000;
  const diff = (new Date(date) - new Date(new Date().toISOString().slice(0, 10))) / day;
  if (diff < -1) return res.status(400).json({ message: 'You cannot change meals of a past date' });
  if (diff > 14) return res.status(400).json({ message: 'You can choose meals only up to 14 days ahead' });

  const old = await Attendance.findOne({ student: req.user.id, date, meal });
  if (old) {
    await old.deleteOne();
    return res.json({ opted: false });
  }
  await Attendance.create({ student: req.user.id, date, meal });
  res.json({ opted: true });
});

// Admin: how many students will eat each meal on a date
router.get('/attendance/count', adminOnly, async (req, res) => {
  if (!isDateText(req.query.date)) return res.status(400).json({ message: 'Invalid date' });
  const result = {};
  for (const meal of MEALS) {
    result[meal] = await Attendance.countDocuments({ date: req.query.date, meal });
  }
  res.json(result);
});

module.exports = router;
