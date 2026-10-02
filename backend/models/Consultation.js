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
  }
}, { timestamps: true });

module.exports = mongoose.model('Consultation', consultationSchema);
