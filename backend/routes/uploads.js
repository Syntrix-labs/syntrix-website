const express = require('express');
const router = express.Router();
const multer = require('multer');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const authMiddleware = require('../middleware/authMiddleware');
const DocumentUpload = require('../models/DocumentUpload');
const Project = require('../models/Project');
const requireAdmin = require('../middleware/adminMiddleware');
const User = require('../models/User');
const { isAdminEmail } = require('../utils/adminAccess');
const { uploadLimiter } = require('../middleware/rateLimiters');

const uploadsDir = path.join(__dirname, '..', 'uploads', 'documents');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, uploadsDir),
  filename: (req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-');
    callback(null, `${Date.now()}-${safeName}`);
  }
});

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip'
]);

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(new Error('Unsupported file type'));
    }

    return callback(null, true);
  }
});

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

function getPublicUrl(req, fileName) {
  return `${req.protocol}://${req.get('host')}/uploads/documents/${fileName}`;
}

async function uploadToGoogleDrive(file) {
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!keyFile || !folderId) {
    return null;
  }

  const auth = new google.auth.GoogleAuth({ keyFile, scopes: SCOPES });
  const drive = google.drive({ version: 'v3', auth });
  const bufferStream = new stream.PassThrough();
  bufferStream.end(fs.readFileSync(file.path));

  const response = await drive.files.create({
    requestBody: {
      name: file.originalname,
      parents: [folderId]
    },
    media: {
      mimeType: file.mimetype,
      body: bufferStream
    },
    fields: 'id, webViewLink, webContentLink'
  });

  await drive.permissions.create({
    fileId: response.data.id,
    requestBody: {
      role: 'reader',
      type: 'anyone'
    }
  });

  return response.data;
}

router.get('/', authMiddleware, async (req, res) => {
  const documents = await DocumentUpload.find({ client: req.user.id })
    .populate('project', 'title')
    .sort({ createdAt: -1 });
  res.json(documents);
});

router.get('/admin/all', authMiddleware, requireAdmin, async (req, res) => {
  const documents = await DocumentUpload.find()
    .populate('client', 'name email')
    .populate('project', 'title')
    .sort({ createdAt: -1 });
  res.json(documents);
});

router.post('/', [authMiddleware, uploadLimiter, upload.single('clientFile')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    let linkedProject = null;
    if (req.body.projectId) {
      linkedProject = await Project.findById(req.body.projectId);
      if (!linkedProject) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      const user = await User.findById(req.user.id).select('email');
      const isOwner = String(linkedProject.client) === req.user.id;
      const isAdmin = isAdminEmail(user?.email);
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Not authorized for this project' });
      }
    }

    let driveFile = null;
    try {
      driveFile = await uploadToGoogleDrive(req.file);
    } catch (error) {
      console.error('Google Drive upload failed, keeping local copy:', error.message);
    }

    const publicUrl = getPublicUrl(req, req.file.filename);
    const document = await DocumentUpload.create({
      client: req.user.id,
      project: linkedProject?._id,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storage: driveFile ? 'google-drive' : 'local',
      localPath: req.file.path,
      publicUrl,
      driveFileId: driveFile?.id,
      driveViewLink: driveFile?.webViewLink,
      driveDownloadLink: driveFile?.webContentLink
    });

    if (linkedProject) {
      await Project.findByIdAndUpdate(linkedProject._id, {
        $push: {
          documentLinks: {
            name: req.file.originalname,
            url: driveFile?.webViewLink || publicUrl
          }
        }
      });
    }

    res.status(201).json({
      success: true,
      message: driveFile ? 'Document uploaded to Google Drive and saved locally.' : 'Document uploaded to local storage.',
      document
    });
  } catch (error) {
    console.error('Document Upload Error:', error);
    res.status(500).json({ success: false, message: 'Server error uploading document' });
  }
});

module.exports = router;
