const mongoose = require('mongoose');

// One collection for both admin and students (role tells which)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true }, // stored as a hash
  role: { type: String, enum: ['admin', 'student'], default: 'student' },
  // student details
  rollNo: String,
  branch: String,
  year: Number,
  phone: String,
  guardianName: String,
  guardianPhone: String,
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
});

module.exports = mongoose.model('User', userSchema);
