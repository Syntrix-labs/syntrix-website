const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Online', 'Offline'],
    default: 'Active'
  }
}, { timestamps: true });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
