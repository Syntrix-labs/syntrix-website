const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Contract = require('../models/Contract');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');
const { generateContract, CONTRACT_TYPES, TYPE_META, COMPANY } = require('../utils/contracts');
const { sendMail } = require('../utils/mailer');

const contractsDir = path.join(__dirname, '..', 'uploads', 'contracts');
fs.mkdirSync(contractsDir, { recursive: true });

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));

function publicUrlFor(req, fileName) {
  return `${req.protocol}://${req.get('host')}/uploads/contracts/${fileName}`;
}

function contractEmailHtml({ name, title }) {
  const firstName = String(name || 'there').split(' ')[0];
  return `
  <div style="margin:0;padding:24px;background:#04140d;font-family:Helvetica,Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#0a1f16;border:1px solid #16352a;border-radius:16px;overflow:hidden">
      <div style="padding:28px 32px;border-bottom:1px solid #16352a">
        <p style="margin:0;font-size:12px;letter-spacing:4px;color:#7f9a86">SYNTRIX LABS</p>
      </div>
      <div style="padding:32px">
        <h1 style="margin:0 0 16px;font-size:22px;font-weight:500;color:#eafff2">Your ${title.toLowerCase()}</h1>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#cfe8d6">Hi ${firstName},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#cfe8d6">
          Please find your <strong>${title}</strong> attached as a PDF. Kindly review it, and if everything looks good,
          sign and return a copy at your convenience.
        </p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#cfe8d6">
          If you have any questions about any of the terms, just reply to this email and we'll be happy to help.
        </p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#9fb6a6">Warm regards,<br/>The Syntrix Labs Team</p>
      </div>
      <div style="padding:18px 32px;border-top:1px solid #16352a">
        <p style="margin:0;font-size:12px;color:#5f7a68">${COMPANY.website}</p>
      </div>
    </div>
  </div>`;
}

// List all contracts (admin).
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  const contracts = await Contract.find()
    .populate('party', 'name email')
    .sort({ createdAt: -1 });
  res.json(contracts);
});

// A client/team member sees their own contracts.
router.get('/mine', authMiddleware, async (req, res) => {
  const contracts = await Contract.find({ party: req.user.id }).sort({ createdAt: -1 });
  res.json(contracts);
});

// Generate a contract. Admin only.
// Body: { type, name, email, partyId?, role, scope, fee, currency, paymentTerms,
//         timeline, probation, notice, sendEmail }
router.post('/generate', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { type } = req.body;
    if (!CONTRACT_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid contract type. Expected one of: ${CONTRACT_TYPES.join(', ')}`
      });
    }

    // Resolve the counterparty: an existing user by id/email, or free-form name+email.
    let partyUser = null;
    if (req.body.partyId) {
      partyUser = await User.findById(req.body.partyId).select('name email');
    } else if (isValidEmail(req.body.email)) {
      partyUser = await User.findOne({ email: String(req.body.email).trim().toLowerCase() }).select('name email');
    }

    const name = (req.body.name || partyUser?.name || '').trim();
    const email = (req.body.email || partyUser?.email || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'A counterparty name is required.' });
    }

    const data = {
      name,
      email,
      role: req.body.role,
      scope: req.body.scope,
      compType: req.body.compType,
      fee: req.body.fee,
      currency: req.body.currency || 'INR',
      paymentTerms: req.body.paymentTerms,
      share: req.body.share,
      shareBasis: req.body.shareBasis,
      timeline: req.body.timeline,
      probation: req.body.probation,
      notice: req.body.notice
    };

    const { filePath, fileName, title } = await generateContract({ type, data, outDir: contractsDir });
    const publicUrl = publicUrlFor(req, fileName);

    // Optionally email the PDF to the counterparty.
    const wantsEmail = req.body.sendEmail !== false && isValidEmail(email);
    let emailed = false;
    if (wantsEmail) {
      try {
        emailed = await sendMail({
          to: email,
          subject: `${title} — Syntrix Labs`,
          html: contractEmailHtml({ name, title }),
          text: `Hi ${name.split(' ')[0]},\n\nPlease find your ${title} attached. Kindly review, sign, and return a copy.\n\nWarm regards,\nThe Syntrix Labs Team\n${COMPANY.website}`,
          attachments: [{ filename: fileName, path: filePath }]
        });
      } catch (error) {
        console.error('Contract email failed:', error.message);
      }
    }

    const contract = await Contract.create({
      type,
      title,
      party: partyUser?._id,
      partyName: name,
      partyEmail: email,
      details: {
        role: data.role,
        scope: data.scope,
        compType: ['salary', 'share', 'both'].includes(data.compType) ? data.compType : undefined,
        fee: data.fee !== undefined && data.fee !== '' ? Number(data.fee) : undefined,
        currency: data.currency,
        paymentTerms: data.paymentTerms,
        share: data.share,
        shareBasis: data.shareBasis,
        timeline: data.timeline,
        probation: data.probation,
        notice: data.notice
      },
      fileName,
      localPath: filePath,
      publicUrl,
      status: emailed ? 'Sent' : 'Draft',
      emailed,
      generatedBy: req.user.id
    });

    res.status(201).json({ success: true, contract, emailed });
  } catch (error) {
    console.error('Contract generation error:', error);
    res.status(500).json({ success: false, message: 'Server error generating contract' });
  }
});

// Download/stream the PDF. Admin, or the counterparty themselves.
router.get('/:id/download', authMiddleware, async (req, res) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) {
    return res.status(404).json({ success: false, message: 'Contract not found' });
  }

  const user = await User.findById(req.user.id).select('email');
  const { isAdminEmail } = require('../utils/adminAccess');
  const isOwner = contract.party && String(contract.party) === req.user.id;
  if (!isAdminEmail(user?.email) && !isOwner) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  if (!contract.localPath || !fs.existsSync(contract.localPath)) {
    return res.status(404).json({ success: false, message: 'Contract file is no longer available' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${contract.fileName}"`);
  fs.createReadStream(contract.localPath).pipe(res);
});

// Update status (e.g. mark Signed) — admin only.
router.put('/:id/status', authMiddleware, requireAdmin, async (req, res) => {
  const allowed = ['Draft', 'Sent', 'Signed'];
  if (!allowed.includes(req.body.status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }
  const contract = await Contract.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!contract) {
    return res.status(404).json({ success: false, message: 'Contract not found' });
  }
  res.json({ success: true, contract });
});

// Delete a contract record (and its file) — admin only.
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) {
    return res.status(404).json({ success: false, message: 'Contract not found' });
  }
  if (contract.localPath && fs.existsSync(contract.localPath)) {
    try { fs.unlinkSync(contract.localPath); } catch { /* ignore */ }
  }
  await Contract.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
