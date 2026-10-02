const mongoose = require('mongoose');

/**
 * A file sent in a consultation chat. The bytes live in MongoDB (Render's disk
 * is wiped on every restart, so local files wouldn't survive), and the TTL
 * index on `expiresAt` makes MongoDB delete the document automatically once it
 * expires. The chat message keeps a copy of the metadata, so it can still show
 * "file expired" after the bytes are gone.
 */
const chatFileSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  mimeType: { type: String, default: 'application/octet-stream' },
  size: { type: Number, required: true },
  data: { type: Buffer, required: true },
  expiresAt: { type: Date, required: true, expires: 0 }
}, { timestamps: true });

module.exports = mongoose.model('ChatFile', chatFileSchema);
