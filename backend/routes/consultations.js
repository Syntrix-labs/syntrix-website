const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const Consultation = require('../models/Consultation');
const ChatFile = require('../models/ChatFile');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const requireStaff = require('../middleware/staffMiddleware');
const { isAdminEmail } = require('../utils/adminAccess');
const { uploadLimiter } = require('../middleware/rateLimiters');
const { announceMessage, startChatNotifier } = require('../utils/chatNotifier');
const { visibleClientIds, canSeeClient } = require('../utils/teamScope');

// Email reminders for unread messages run in the background (not in tests).
startChatNotifier();

const CHAT_FILE_MAX_BYTES = 10 * 1024 * 1024; // 10 MB (MongoDB documents cap at 16 MB)
const CHAT_FILE_TTL_DAYS = 30;
// Programs and scripts are refused; everything else (images, PDFs, SVG/AI/PSD, zips…) is allowed.
const BLOCKED_FILE = /\.(exe|msi|bat|cmd|com|scr|ps1|vbs|jar|apk|dmg|pkg|app|sh|js|html?)$/i;

const receiveChatFile = (req, res, next) =>
  multer({ storage: multer.memoryStorage(), limits: { fileSize: CHAT_FILE_MAX_BYTES, files: 1 } })
    .single('file')(req, res, (err) => {
      if (err && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ success: false, message: 'That file is too large. The limit is 10 MB.' });
      }
      if (err) return res.status(400).json({ success: false, message: 'Upload failed. Please try again.' });
      return next();
    });

// Staff (admins + team) post into a chosen client's thread as "Admin"; clients
// can only ever post into their own thread as "Client". Team members only
// reach clients whose projects they're assigned to (see utils/teamScope).
async function resolveThread(req) {
  const me = await User.findById(req.user.id).select('name email role');
  const isAdmin = isAdminEmail(me?.email);
  const staff = isAdmin || me?.role === 'team';
  const clientId = staff ? req.body.client : req.user.id;
  const allowed = !staff || (await canSeeClient({ email: me?.email, isAdmin }, clientId));
  return { me, staff, clientId, allowed };
}

const notYourClient = (res) =>
  res.status(403).json({ success: false, message: "You can only message clients whose projects you're assigned to." });

function broadcast(req, clientId, message, sender) {
  announceMessage(req.app.get('io'), message, sender);
}

router.get('/', authMiddleware, async (req, res) => {
  const messages = await Consultation.find({ client: req.user.id }).sort({ createdAt: 1 });
  res.json(messages);
});

// Unread counts for badges. Clients: staff messages they haven't read.
// Staff: client messages nobody on the team has read yet, per client.
router.get('/unread', authMiddleware, async (req, res) => {
  const me = await User.findById(req.user.id).select('email role');
  const isAdmin = isAdminEmail(me?.email);
  if (!isAdmin && me?.role !== 'team') {
    const total = await Consultation.countDocuments({ client: req.user.id, senderRole: 'Admin', readAt: null });
    return res.json({ total });
  }
  const visible = await visibleClientIds({ email: me.email, isAdmin });
  const match = { senderRole: 'Client', readAt: null };
  if (visible) match.client = { $in: visible.map((id) => new mongoose.Types.ObjectId(id)) };
  const rows = await Consultation.aggregate([
    { $match: match },
    { $group: { _id: '$client', n: { $sum: 1 } } },
  ]);
  const byClient = {};
  rows.forEach((r) => { if (r._id) byClient[String(r._id)] = r.n; });
  return res.json({ total: rows.reduce((sum, r) => sum + r.n, 0), byClient });
});

// Mark the other side's messages in a conversation as read
// (clients: their own thread; staff: pass { client }).
router.post('/read', authMiddleware, async (req, res) => {
  const { staff, clientId, allowed } = await resolveThread(req);
  if (!clientId || !mongoose.isValidObjectId(clientId)) {
    return res.status(400).json({ success: false, message: 'Select a client' });
  }
  if (!allowed) return notYourClient(res);
  const result = await Consultation.updateMany(
    { client: clientId, senderRole: staff ? 'Client' : 'Admin', readAt: null },
    { $set: { readAt: new Date() } }
  );
  return res.json({ success: true, marked: result.modifiedCount });
});

router.get('/admin/all', authMiddleware, requireStaff, async (req, res) => {
  const visible = await visibleClientIds(req.staff);
  const messages = await Consultation.find(visible ? { client: { $in: visible } } : {})
    .populate('client', 'name email')
    .sort({ createdAt: -1 });
  res.json(messages);
});

router.get('/admin/:clientId', authMiddleware, requireStaff, async (req, res) => {
  if (!(await canSeeClient(req.staff, req.params.clientId))) return notYourClient(res);
  const messages = await Consultation.find({ client: req.params.clientId }).sort({ createdAt: 1 });
  res.json(messages);
});

router.post('/', authMiddleware, async (req, res) => {
  const text = typeof req.body.message === 'string' ? req.body.message.trim() : '';
  if (!text) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  const { me, staff, clientId, allowed } = await resolveThread(req);
  if (staff && !clientId) {
    return res.status(400).json({ success: false, message: 'Select a client to message' });
  }
  if (!allowed) return notYourClient(res);

  const message = await Consultation.create({
    client: clientId,
    senderRole: staff ? 'Admin' : 'Client',
    senderName: me?.name,
    message: text,
  });

  broadcast(req, clientId, message, me);
  res.status(201).json({ success: true, message });
});

// Send a file into a conversation (multipart field "file", optional "message" caption).
router.post('/attachment', authMiddleware, uploadLimiter, receiveChatFile, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Choose a file to send.' });
    }
    if (BLOCKED_FILE.test(req.file.originalname)) {
      return res.status(400).json({ success: false, message: "Programs and scripts can't be sent in chat." });
    }

    const { me, staff, clientId, allowed } = await resolveThread(req);
    if (!clientId || !mongoose.isValidObjectId(clientId)) {
      return res.status(400).json({ success: false, message: 'Select a client to message' });
    }
    if (!allowed) return notYourClient(res);

    const expiresAt = new Date(Date.now() + CHAT_FILE_TTL_DAYS * 24 * 60 * 60 * 1000);
    const file = await ChatFile.create({
      client: clientId,
      uploadedBy: req.user.id,
      name: req.file.originalname,
      mimeType: req.file.mimetype || 'application/octet-stream',
      size: req.file.size,
      data: req.file.buffer,
      expiresAt,
    });

    const caption = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    const message = await Consultation.create({
      client: clientId,
      senderRole: staff ? 'Admin' : 'Client',
      senderName: me?.name,
      message: caption,
      attachment: { fileId: file._id, name: file.name, mimeType: file.mimeType, size: file.size, expiresAt },
    });

    broadcast(req, clientId, message, me);
    return res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('Chat file upload error:', error);
    return res.status(500).json({ success: false, message: 'Server error sending the file.' });
  }
});

// Download a chat file. Only that client or staff may fetch it; once expired
// (or auto-deleted by MongoDB) it returns 410 Gone.
router.get('/files/:fileId', authMiddleware, async (req, res) => {
  const expired = () =>
    res.status(410).json({ success: false, expired: true, message: `This file has expired. Files are kept for ${CHAT_FILE_TTL_DAYS} days.` });

  if (!mongoose.isValidObjectId(req.params.fileId)) return expired();
  const file = await ChatFile.findById(req.params.fileId);
  if (!file || file.expiresAt <= new Date()) return expired();

  if (String(file.client) !== String(req.user.id)) {
    const me = await User.findById(req.user.id).select('email role');
    const isAdmin = isAdminEmail(me?.email);
    const staff = isAdmin || me?.role === 'team';
    if (!staff || !(await canSeeClient({ email: me.email, isAdmin }, file.client))) {
      return res.status(403).json({ success: false, message: 'Not allowed' });
    }
  }

  res.set({
    'Content-Type': file.mimeType || 'application/octet-stream',
    'Content-Length': String(file.size),
    'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'private, no-store',
  });
  return res.send(file.data);
});

module.exports = router;
