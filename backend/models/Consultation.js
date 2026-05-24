const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  senderRole: { type: String, enum: ['Admin', 'Client'], default: 'Admin' },
  message: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Consultation', consultationSchema);
