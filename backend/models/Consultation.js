const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  senderRole: { type: String, enum: ['Admin', 'Client'], default: 'Admin' },
  // Who actually wrote it (e.g. which team member), shown in the chat.
  senderName: String,
  // Text, or the optional caption of a file message.
  message: { type: String, default: '' },
  // Metadata of a file sent in the chat. The bytes live in ChatFile and are
  // deleted automatically at `expiresAt`; this copy stays so the chat can show
  // "file expired" afterwards.
  attachment: {
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatFile' },
    name: String,
    mimeType: String,
    size: Number,
    expiresAt: Date
  },
  // When the *other* side read it (client reads staff messages, staff read
  // client messages). null = unread → drives badges and email reminders.
  readAt: { type: Date, default: null },
  // Set once the unread-reminder email sweep has looked at this message;
  // emailSent marks the one message per unread streak that triggered an email.
  emailedAt: { type: Date, default: null },
  emailSent: { type: Boolean, default: false }
}, { timestamps: true });

consultationSchema.index({ client: 1, senderRole: 1, readAt: 1 });

module.exports = mongoose.model('Consultation', consultationSchema);
