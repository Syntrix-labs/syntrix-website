const mongoose = require('mongoose');

const documentUploadSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: String,
  size: Number,
  storage: {
    type: String,
    enum: ['local', 'google-drive'],
    default: 'local'
  },
  localPath: String,
  publicUrl: String,
  driveFileId: String,
  driveViewLink: String,
  driveDownloadLink: String
}, { timestamps: true });

module.exports = mongoose.model('DocumentUpload', documentUploadSchema);
