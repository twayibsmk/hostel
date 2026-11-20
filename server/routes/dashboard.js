// Numbers shown on the dashboard
const express = require('express');
const User = require('../models/User');
const Room = require('../models/Room');
const Fee = require('../models/Fee');
const Complaint = require('../models/Complaint');
const { login } = require('../middleware/auth');

const router = express.Router();
router.use(login);

router.get('/', async (req, res) => {
  if (req.user.role === 'admin') {
    const rooms = await Room.find();
    const totalBeds = rooms.reduce((sum, r) => sum + r.capacity, 0);
    const usedBeds = rooms.reduce((sum, r) => sum + r.occupants.length, 0);
    const pending = await Fee.find({ status: 'pending' });
    res.json({
      students: await User.countDocuments({ role: 'student' }),
      rooms: rooms.length,
      totalBeds,
      occupiedBeds: usedBeds,
      vacantBeds: totalBeds - usedBeds,
      pendingFees: pending.length,
      pendingAmount: pending.reduce((sum, f) => sum + f.amount, 0),
      openComplaints: await Complaint.countDocuments({ status: { $ne: 'Resolved' } }),
    });
  } else {
    const me = await User.findById(req.user.id).populate('room');
    const pending = await Fee.find({ student: req.user.id, status: 'pending' });
    res.json({
      room: me.room ? me.room.roomNo + ' (Block ' + me.room.block + ')' : 'Not allotted yet',
      pendingFees: pending.length,
      pendingAmount: pending.reduce((sum, f) => sum + f.amount, 0),
      openComplaints: await Complaint.countDocuments({ student: req.user.id, status: { $ne: 'Resolved' } }),
    });
  }
});

module.exports = router;
