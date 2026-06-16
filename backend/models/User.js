const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['client', 'team'],
    default: 'client'
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  phone: String,
  company: String,
  emailOtp: String,
  emailOtpExpire: Date
}, { timestamps: true }); 

module.exports = mongoose.model('User', userSchema);
