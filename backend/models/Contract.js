const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  // What kind of agreement this is.
  type: {
    type: String,
    enum: ['client', 'member-contractor', 'member-employee'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  // The counterparty (the person the contract is for). Linked to a User when
  // one exists; name/email are always stored so the record stands alone.
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  partyName: {
    type: String,
    required: true
  },
  partyEmail: String,
  // The values that were filled into the template, kept for the record/audit.
  details: {
    role: String,
    scope: String,
    // Member compensation: monthly salary, a per-deal revenue share, or both.
    compType: { type: String, enum: ['salary', 'share', 'both'], default: 'salary' },
    fee: Number,
    currency: { type: String, default: 'INR' },
    paymentTerms: String,
    // Per-deal share details (a percentage cut of each deal — NOT equity).
    share: String,
    shareBasis: String,
    timeline: String,
    probation: String,
    notice: String
  },
  // Generated PDF location.
  fileName: String,
  localPath: String,
  publicUrl: String,
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Signed'],
    default: 'Draft'
  },
  emailed: {
    type: Boolean,
    default: false
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Contract', contractSchema);
