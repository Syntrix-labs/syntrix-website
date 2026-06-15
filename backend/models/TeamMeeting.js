const mongoose = require('mongoose');

const teamMeetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  agenda: { type: String },
  attendees: [{ type: String }],
  link: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('TeamMeeting', teamMeetingSchema);
