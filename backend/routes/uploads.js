const express = require('express');
const router = express.Router();
const multer = require('multer');
const { google } = require('googleapis');
const stream = require('stream');
const authMiddleware = require('../middleware/authMiddleware');

// 1. Configure Multer to store files in memory (not on your disk)
const upload = multer({ storage: multer.memoryStorage() });

// 2. Authenticate your "Robot User" with Google Drive
const KEYFILEPATH = 'credentials.json';
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});
const drive = google.drive({ version: 'v3', auth });

// PASTE YOUR FOLDER ID HERE
const PARENT_FOLDER_ID = 'YOUR_COPIED_FOLDER_ID_HERE'; 

// @route   POST /api/uploads
// @desc    Upload a file directly to Google Drive
router.post('/', [authMiddleware, upload.single('clientFile')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Convert the file buffer into a readable stream for Google Drive
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    // Send the file to Google Drive
    const response = await drive.files.create({
      requestBody: {
        name: req.file.originalname, // Keep the original file name
        parents: [PARENT_FOLDER_ID], // Put it in the specific folder
      },
      media: {
        mimeType: req.file.mimetype,
        body: bufferStream,
      },
      fields: 'id, webViewLink, webContentLink', // Ask Google to send back the download links
    });

    // Make the file readable to anyone with the link (so the frontend can display it)
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    res.status(201).json({
      message: 'File successfully uploaded to Google Drive',
      fileId: response.data.id,
      viewLink: response.data.webViewLink,
      downloadLink: response.data.webContentLink
    });

  } catch (error) {
    console.error('Drive Upload Error:', error);
    res.status(500).json({ message: 'Server error uploading file' });
  }
});

module.exports = router;