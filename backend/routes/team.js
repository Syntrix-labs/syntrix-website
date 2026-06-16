const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const TeamMember = require('../models/TeamMember');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');
const { getTransporter } = require('../utils/mailer');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));

async function sendWelcomeEmail({ name, role, email, tempPassword }) {
  const transporter = getTransporter();
  if (!transporter || !isValidEmail(email)) {
    return false;
  }

  const firstName = String(name || 'there').split(' ')[0];
  const loginHtml = tempPassword ? `
        <div style="margin:0 0 24px;padding:16px 18px;background:#0c2a1d;border:1px solid #2c6b4f;border-radius:12px">
          <p style="margin:0 0 8px;font-size:13px;color:#bdebcf">Your account is ready — sign in at <a href="https://syntrixlabs.in/login" style="color:#34d399">syntrixlabs.in/login</a>:</p>
          <p style="margin:0;font-size:14px;color:#eafff2">Email: <strong>${email}</strong></p>
          <p style="margin:4px 0 0;font-size:14px;color:#eafff2">Temporary password: <strong>${tempPassword}</strong></p>
          <p style="margin:8px 0 0;font-size:12px;color:#9fb6a6">Please reset your password after your first login.</p>
        </div>` : '';
  const loginText = tempPassword ? `\nYour account is ready — sign in at https://syntrixlabs.in/login\nEmail: ${email}\nTemporary password: ${tempPassword}\n(Please reset it after your first login.)\n` : '';
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
        ${loginHtml}
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

  const text = `Welcome to the team, ${firstName}!\n\nWe're thrilled to have you on board at Syntrix Labs as our new ${role || 'team member'}. Congratulations and welcome aboard!\n${loginText}\nWe'll be in touch shortly with your next steps.\n\nWarm regards,\nThe Syntrix Labs Team\nsyntrixlabs.in`;

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
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : undefined;
  const member = await TeamMember.create({
    name: req.body.name,
    role: req.body.role,
    email,
    status: req.body.status || 'Active'
  });

  // Auto-provision a team account (role 'team') so they can sign in.
  let tempPassword;
  if (email && isValidEmail(email)) {
    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.role !== 'team') {
        existing.role = 'team';
        await existing.save();
      }
    } else {
      tempPassword = '1234';
      const hashed = await bcrypt.hash(tempPassword, await bcrypt.genSalt(10));
      await User.create({ name: req.body.name, email, password: hashed, role: 'team' });
    }
  }

  let emailed = false;
  try {
    emailed = await sendWelcomeEmail({ name: member.name, role: member.role, email: member.email, tempPassword });
  } catch (error) {
    console.error('Welcome email failed:', error.message);
  }

  res.status(201).json({ success: true, member, emailed, accountCreated: Boolean(tempPassword) });
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
