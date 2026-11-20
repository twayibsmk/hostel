const mongoose = require('mongoose');

// Weekly menu: one row for each day + meal
const menuSchema = new mongoose.Schema({
  day: { type: String, required: true }, // Monday ... Sunday
  meal: { type: String, enum: ['Breakfast', 'Lunch', 'Dinner'], required: true },
  items: { type: String, required: true, trim: true, maxlength: 200 }, // e.g. "Idli, Sambar, Chutney"
});
menuSchema.index({ day: 1, meal: 1 }, { unique: true });

// Student says "I will eat this meal on this date"
const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  meal: { type: String, enum: ['Breakfast', 'Lunch', 'Dinner'], required: true },
});
// A student cannot opt in for the same meal twice
attendanceSchema.index({ student: 1, date: 1, meal: 1 }, { unique: true });

module.exports = {
  Menu: mongoose.model('Menu', menuSchema),
  Attendance: mongoose.model('Attendance', attendanceSchema),
};
