// Rooms and room allotment
const express = require('express');
const Room = require('../models/Room');
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

// List rooms with the students living in them
router.get('/', async (req, res) => {
  const rooms = await Room.find().sort('block roomNo').populate('occupants', 'name rollNo');
  res.json(rooms);
});

// Add a room
router.post('/', adminOnly, async (req, res) => {
  const roomNo = String(req.body.roomNo || '').trim();
  const block = String(req.body.block || 'A').trim() || 'A';
  const floor = Number(req.body.floor || 0);
  const capacity = Number(req.body.capacity || 2);

  if (!roomNo || roomNo.length > 10) return res.status(400).json({ message: 'Room number is required (max 10 characters)' });
  if (!Number.isInteger(floor) || floor < 0 || floor > 50) return res.status(400).json({ message: 'Floor must be between 0 and 50' });
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 10) return res.status(400).json({ message: 'Capacity must be between 1 and 10' });
  if (await Room.findOne({ roomNo, block })) return res.status(400).json({ message: 'This room already exists in block ' + block });

  const room = await Room.create({ roomNo, block, floor, capacity });
  res.json(room);
});

// Delete a room (only if empty)
router.delete('/:id', adminOnly, async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  if (room.occupants.length > 0) return res.status(400).json({ message: 'Room is not empty. Remove students first.' });
  await room.deleteOne();
  res.json({ message: 'Room deleted' });
});

// Allot a student to a room
router.post('/:id/allot', adminOnly, async (req, res) => {
  const studentId = req.body.studentId;
  if (!isId(studentId)) return res.status(400).json({ message: 'Please select a student' });

  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  const student = await User.findOne({ _id: studentId, role: 'student' });
  if (!student) return res.status(404).json({ message: 'Student not found' });

  // Step 1: take the student only if he has no room (safe even if two admins click together)
  const taken = await User.findOneAndUpdate({ _id: student._id, room: null }, { room: room._id });
  if (!taken) return res.status(400).json({ message: 'Student already has a room' });

  // Step 2: add him to the room only if a bed is free
  const added = await Room.findOneAndUpdate(
    { _id: room._id, $expr: { $lt: [{ $size: '$occupants' }, '$capacity'] } },
    { $push: { occupants: student._id } }
  );
  if (!added) {
    await User.findByIdAndUpdate(student._id, { room: null }); // undo step 1
    return res.status(400).json({ message: 'Room is full' });
  }

  await Notification.send(student._id, 'You have been allotted room ' + room.roomNo + ' (Block ' + room.block + ')');
  res.json({ message: 'Room allotted' });
});

// Remove a student from a room
router.post('/:id/vacate', adminOnly, async (req, res) => {
  const studentId = req.body.studentId;
  if (!isId(studentId)) return res.status(400).json({ message: 'Invalid student' });

  const room = await Room.findOneAndUpdate({ _id: req.params.id, occupants: studentId }, { $pull: { occupants: studentId } });
  if (!room) return res.status(400).json({ message: 'This student is not in this room' });

  await User.findByIdAndUpdate(studentId, { room: null });
  await Notification.send(studentId, 'You have vacated room ' + room.roomNo);
  res.json({ message: 'Room vacated' });
});

module.exports = router;
