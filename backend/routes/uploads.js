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

const uploadsDir = path.join(__dirname, '..', 'uploads', 'documents');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, uploadsDir),
  filename: (req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-');
    callback(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }
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

router.get('/admin/all', authMiddleware, async (req, res) => {
  const documents = await DocumentUpload.find()
    .populate('client', 'name email')
    .populate('project', 'title')
    .sort({ createdAt: -1 });
  res.json(documents);
});

router.post('/', [authMiddleware, upload.single('clientFile')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
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
      project: req.body.projectId || undefined,
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

    if (req.body.projectId) {
      await Project.findByIdAndUpdate(req.body.projectId, {
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
