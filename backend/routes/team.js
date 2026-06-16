const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const TeamMember = require('../models/TeamMember');
const authMiddleware = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));

async function sendWelcomeEmail({ name, role, email }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !isValidEmail(email)) {
    return false;
  }

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  const firstName = String(name || 'there').split(' ')[0];
  const html = `
  <div style="margin:0;padding:24px;background:#04140d;font-family:Helvetica,Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#0a1f16;border:1px solid #16352a;border-radius:16px;overflow:hidden">
      <div style="padding:28px 32px;border-bottom:1px solid #16352a">
        <p style="margin:0;font-size:12px;letter-spacing:4px;color:#7f9a86">SYNTRIX LABS</p>
      </div>
      <div style="padding:32px">
        <h1 style="margin:0 0 16px;font-size:24px;font-weight:500;color:#eafff2">Welcome to the team, ${firstName} &#127881;</h1>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#cfe8d6">
          We're thrilled to have you on board at <strong>Syntrix Labs</strong> as our new
          <strong>${role || 'team member'}</strong>. Congratulations and welcome aboard!
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#cfe8d6">
          You're joining a team that ships premium websites, apps, and platforms for ambitious
          startups. We can't wait to build great things together.
        </p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#cfe8d6">
          We'll be in touch shortly with your next steps. If you have any questions in the meantime,
          just reply to this email.
        </p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#9fb6a6">
          Warm regards,<br/>The Syntrix Labs Team
        </p>
      </div>
      <div style="padding:18px 32px;border-top:1px solid #16352a">
        <p style="margin:0;font-size:12px;color:#5f7a68">syntrixlabs.in &middot; Built by Soham &amp; Tahir</p>
      </div>
    </div>
  </div>`;

  const text = `Welcome to the team, ${firstName}!\n\nWe're thrilled to have you on board at Syntrix Labs as our new ${role || 'team member'}. Congratulations and welcome aboard!\n\nWe'll be in touch shortly with your next steps.\n\nWarm regards,\nThe Syntrix Labs Team\nsyntrixlabs.in`;

  await transporter.sendMail({
    from: `Syntrix Labs <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to the Syntrix Labs team 🎉',
    text,
    html
  });
  return true;
}

router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  const members = await TeamMember.find().sort({ createdAt: -1 });
  res.json(members);
});

router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  const member = await TeamMember.create({
    name: req.body.name,
    role: req.body.role,
    email: typeof req.body.email === 'string' ? req.body.email.trim() : undefined,
    status: req.body.status || 'Active'
  });

  let emailed = false;
  try {
    emailed = await sendWelcomeEmail({ name: member.name, role: member.role, email: member.email });
  } catch (error) {
    console.error('Welcome email failed:', error.message);
  }

  res.status(201).json({ success: true, member, emailed });
});

router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  const member = await TeamMember.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, member });
});

router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  await TeamMember.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
