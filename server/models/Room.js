const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNo: { type: String, required: true, trim: true },
  block: { type: String, default: 'A', trim: true },
  floor: { type: Number, default: 0, min: 0 },
  capacity: { type: Number, default: 2, min: 1 },
  occupants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

// The same room number can exist in different blocks, but not twice in one block
roomSchema.index({ block: 1, roomNo: 1 }, { unique: true });

module.exports = mongoose.model('Room', roomSchema);
