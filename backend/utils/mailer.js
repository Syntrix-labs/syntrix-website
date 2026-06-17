const nodemailer = require('nodemailer');

/**
 * Provider-agnostic email sender.
 *
 * Render (and many cloud hosts) block outbound SMTP ports, so Gmail/SMTP times
 * out there. We prefer Resend's HTTPS API (port 443, always allowed) when
 * RESEND_API_KEY is set, and fall back to SMTP locally otherwise.
 *
 * Returns true if an email was dispatched, false if no provider is configured.
 * Throws if a configured provider fails (callers can catch).
 */
async function sendMail({ to, subject, html, text, attachments }) {
  if (!to) return false;

  // attachments: [{ filename, path }] or [{ filename, content: Buffer }]
  const loadAttachment = (att) => {
    const buffer = att.content
      ? (Buffer.isBuffer(att.content) ? att.content : Buffer.from(att.content))
      : require('fs').readFileSync(att.path);
    return { filename: att.filename, buffer };
  };

  // 1) Resend over HTTPS — works on Render.
  if (process.env.RESEND_API_KEY) {
    const from = process.env.MAIL_FROM || 'Syntrix Labs <onboarding@resend.dev>';
    const payload = { from, to: [to], subject, html, text };
    if (attachments && attachments.length) {
      payload.attachments = attachments.map((att) => {
        const { filename, buffer } = loadAttachment(att);
        return { filename, content: buffer.toString('base64') };
      });
    }
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend ${res.status}: ${body.slice(0, 300)}`);
    }
    return true;
  }

  // 2) SMTP fallback (works locally; blocked on Render).
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      family: 4,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
    await transporter.sendMail({
      from: process.env.MAIL_FROM || `Syntrix Labs <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text,
      attachments: (attachments || []).map((att) => {
        const { filename, buffer } = loadAttachment(att);
        return { filename, content: buffer };
      }),
    });
    return true;
  }

  return false;
}

module.exports = { sendMail };
