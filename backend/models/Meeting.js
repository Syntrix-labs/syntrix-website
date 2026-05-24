const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, default: 'Client consultation' },
  date: { type: String, required: true },
  time: { type: String, required: true },
  timezone: { type: String, default: 'Asia/Kolkata' },
  status: { type: String, enum: ['Requested', 'Confirmed', 'Completed', 'Cancelled'], default: 'Requested' },
  meetingLink: String,
  meetingPlatform: { type: String, enum: ['Google Meet', 'Zoom', 'Phone', 'Other'], default: 'Google Meet' },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);
