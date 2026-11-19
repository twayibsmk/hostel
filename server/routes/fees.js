// Fee tracking
const express = require('express');
const Fee = require('../models/Fee');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { login, adminOnly } = require('../middleware/auth');
const { isId } = require('../utils/validate');

const router = express.Router();
router.use(login);

router.param('id', (req, res, next, id) => {
  if (!isId(id)) return res.status(400).json({ message: 'Invalid id' });
  next();
});

// Admin sees all fees, a student sees only his own
router.get('/', async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { student: req.user.id };
  const fees = await Fee.find(filter).sort('-dueDate').populate('student', 'name rollNo');
  res.json(fees);
});

// Admin creates a fee for one student
router.post('/', adminOnly, async (req, res) => {
  const { student, dueDate } = req.body;
  const amount = Number(req.body.amount);
  const description = String(req.body.description || 'Hostel fee').trim() || 'Hostel fee';

  if (!isId(student)) return res.status(400).json({ message: 'Please select a student' });
  if (!Number.isFinite(amount) || amount < 1 || amount > 10000000) return res.status(400).json({ message: 'Amount must be between 1 and 1,00,00,000' });
  if (!dueDate || isNaN(new Date(dueDate))) return res.status(400).json({ message: 'Please enter a valid due date' });
  if (description.length > 100) return res.status(400).json({ message: 'Description is too long (max 100)' });
  if (!(await User.findOne({ _id: student, role: 'student' }))) return res.status(404).json({ message: 'Student not found' });

  const fee = await Fee.create({ student, description, amount, dueDate });
  await Notification.send(student, 'New fee added: Rs ' + amount + ' (' + description + '), due ' + new Date(dueDate).toDateString());
  res.json(fee);
});

// Admin marks a fee as paid (only if it is still pending, so it cannot be paid twice)
router.put('/:id/pay', adminOnly, async (req, res) => {
  const fee = await Fee.findOneAndUpdate({ _id: req.params.id, status: 'pending' }, { status: 'paid', paidDate: new Date() }, { new: true });
  if (!fee) {
    const exists = await Fee.findById(req.params.id);
    return res.status(exists ? 400 : 404).json({ message: exists ? 'Fee is already paid' : 'Fee not found' });
  }
  await Notification.send(fee.student, 'Payment of Rs ' + fee.amount + ' received. Thank you!');
  res.json(fee);
});

// Admin sends reminders: unpaid fees that are overdue or due within 3 days.
// A fee gets at most one reminder per day.
router.post('/remind', adminOnly, async (req, res) => {
  const limit = new Date();
  limit.setDate(limit.getDate() + 3);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const fees = await Fee.find({
    status: 'pending',
    dueDate: { $lte: limit },
    $or: [{ lastReminded: null }, { lastReminded: { $lt: startOfToday } }],
  });

  for (const fee of fees) {
    const late = fee.dueDate < new Date();
    await Notification.send(
      fee.student,
      (late ? 'OVERDUE: ' : 'Reminder: ') + 'Rs ' + fee.amount + ' (' + fee.description + ') due on ' + fee.dueDate.toDateString()
    );
    fee.lastReminded = new Date();
    await fee.save();
  }
  res.json({ message: fees.length === 0 ? 'No new reminders needed today' : 'Reminders sent for ' + fees.length + ' fee(s)' });
});

router.delete('/:id', adminOnly, async (req, res) => {
  const fee = await Fee.findByIdAndDelete(req.params.id);
  if (!fee) return res.status(404).json({ message: 'Fee not found' });
  res.json({ message: 'Fee deleted' });
});

module.exports = router;
