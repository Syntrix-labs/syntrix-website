const nodemailer = require('nodemailer');

/**
 * Returns a configured Gmail transporter, or null if email isn't configured.
 * Pins to IPv4 + explicit host/port with timeouts — cloud hosts (e.g. Render)
 * often hang on IPv6 SMTP, which surfaces as "Connection timeout".
 */
function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    family: 4,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
}

module.exports = { getTransporter };
