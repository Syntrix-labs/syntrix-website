const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  title: { type: String, required: true },
  amount: { type: Number, default: 0 },
  dueDate: String,
  status: { type: String, enum: ['Upcoming', 'Paid', 'Overdue'], default: 'Upcoming' },
  paymentUrl: String,
  provider: { type: String, enum: ['Manual', 'Razorpay'], default: 'Manual' },
  razorpayPaymentLinkId: String,
  razorpayOrderId: String,
  currency: { type: String, default: 'INR' }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
