const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, default: 'Hostel fee', trim: true, maxlength: 100 },
  amount: { type: Number, required: true, min: 1 },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  paidDate: Date,
  lastReminded: Date, // so we do not send the same reminder many times in one day
});

module.exports = mongoose.model('Fee', feeSchema);
