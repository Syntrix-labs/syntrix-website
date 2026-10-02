const mongoose = require('mongoose');
const webpush = require('web-push');
const Consultation = require('../models/Consultation');
const PushSubscription = require('../models/PushSubscription');
const User = require('../models/User');
const { adminEmails } = require('./adminAccess');
const { sendMail } = require('./mailer');

/**
 * Consultation-chat notifications.
 *  - Push: sent immediately to the other side's subscribed devices (free).
 *  - Email: Resend has a small quota, so email is only a *reminder*: a message
 *    still unread after CHAT_EMAIL_AFTER_MINUTES (default 10) triggers one email
 *    per unread streak per conversation, capped at CHAT_EMAIL_DAILY_CAP/day.
 */

const minutes = (n) => n * 60 * 1000;
const emailAfterMs = () => minutes(Number(process.env.CHAT_EMAIL_AFTER_MINUTES || 10));
const emailDailyCap = () => Number(process.env.CHAT_EMAIL_DAILY_CAP || 50);
const siteUrl = () =>
  (process.env.PUBLIC_APP_URL || (process.env.CLIENT_URL || 'https://syntrixlabs.in').split(',')[0])
    .trim()
    .replace(/\/$/, '');

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function preview(message) {
  const text = message.message || (message.attachment && message.attachment.name ? `📎 ${message.attachment.name}` : 'New message');
  return text.length > 140 ? `${text.slice(0, 137)}…` : text;
}

/** Returns { publicKey } when VAPID keys are configured, otherwise null (push disabled). */
function pushConfig() {
  const publicKey = (process.env.VAPID_PUBLIC_KEY || '').trim();
  const privateKey = (process.env.VAPID_PRIVATE_KEY || '').trim();
  if (!publicKey || !privateKey) return null;
  webpush.setVapidDetails((process.env.VAPID_SUBJECT || siteUrl()).trim(), publicKey, privateKey);
  return { publicKey };
}

async function staffUserIds() {
  const staff = await User.find({ $or: [{ role: 'team' }, { email: { $in: adminEmails() } }] }).select('_id');
  return staff.map((u) => String(u._id));
}

async function pushToUsers(userIds, payload) {
  if (!userIds.length || !pushConfig()) return 0;
  const subs = await PushSubscription.find({ user: { $in: userIds } });
  let delivered = 0;
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, JSON.stringify(payload), { TTL: 6 * 3600 });
        delivered += 1;
      } catch (error) {
        // 404/410 = the browser unsubscribed or the app was removed; forget it.
        if (error && (error.statusCode === 404 || error.statusCode === 410)) {
          await PushSubscription.deleteOne({ _id: sub._id });
        } else {
          console.error('Push failed:', (error && (error.statusCode || error.message)) || error);
        }
      }
    })
  );
  return delivered;
}

/** Push a new chat message to the other side. `sender` is the User who sent it. */
async function notifyNewMessage(message, sender) {
  const clientId = String(message.client);
  const body = preview(message);
  if (message.senderRole === 'Admin') {
    return pushToUsers([clientId], {
      title: `${message.senderName || 'Syntrix'} · Syntrix`,
      body,
      url: '/dashboard/consultation',
      tag: `chat-${clientId}`,
    });
  }
  const staff = (await staffUserIds()).filter((id) => id !== String(sender && sender._id));
  return pushToUsers(staff, {
    title: `New message from ${message.senderName || 'a client'}`,
    body,
    url: `/admin/consultation?client=${clientId}`,
    tag: `chat-${clientId}`,
  });
}

function reminderEmail({ toClient, clientName, senderName, count, text, link }) {
  const what = count > 1 ? `${count} new messages` : 'a new message';
  const subject = toClient ? `New message from ${senderName || 'Syntrix Labs'}` : `New message from ${clientName || 'a client'}`;
  const intro = toClient
    ? `${senderName || 'The Syntrix team'} sent you ${what} on Syntrix Labs:`
    : `${clientName || 'A client'} sent ${what} in consultation:`;
  const plain = `${intro}\n\n"${text}"\n\nOpen the conversation: ${link}\n\nYou're getting this because the message is still unread.`;
  const html = `
  <div style="margin:0;padding:24px;background:#04140d;font-family:Helvetica,Arial,sans-serif">
    <div style="max-width:520px;margin:0 auto;background:#0a1f16;border:1px solid #16352a;border-radius:16px;overflow:hidden">
      <div style="padding:22px 28px;border-bottom:1px solid #16352a">
        <p style="margin:0;font-size:12px;letter-spacing:4px;color:#7f9a86">SYNTRIX LABS</p>
      </div>
      <div style="padding:28px">
        <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#cfe8d6">${escapeHtml(intro)}</p>
        <p style="margin:0 0 22px;padding:14px 16px;border-left:3px solid #34d399;background:#0c2a1d;border-radius:8px;font-size:15px;line-height:1.6;color:#eafff2">${escapeHtml(text)}</p>
        <a href="${link}" style="display:inline-block;padding:12px 22px;border-radius:12px;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px">Open conversation</a>
        <p style="margin:22px 0 0;font-size:12px;color:#5f7a68">You're getting this because the message is still unread.</p>
      </div>
    </div>
  </div>`;
  return { subject, text: plain, html };
}

/**
 * Email reminders for messages that stayed unread. Safe to run often: each
 * message is only considered once, and only one email goes out per unread
 * streak in a conversation until the recipient reads it.
 */
async function runEmailSweep({ now = new Date(), send = sendMail } = {}) {
  const pending = await Consultation.find({
    readAt: null,
    emailedAt: null,
    createdAt: { $lte: new Date(now - emailAfterMs()), $gte: new Date(now - minutes(3 * 24 * 60)) },
  })
    .sort({ createdAt: 1 })
    .populate('client', 'name email');
  if (!pending.length) return { sent: 0, skipped: 0 };

  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);
  let sentToday = await Consultation.countDocuments({ emailSent: true, emailedAt: { $gte: startOfDay } });

  const groups = new Map();
  for (const m of pending) {
    if (!m.client || !m.client._id) continue;
    const key = `${m.client._id}|${m.senderRole}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(m);
  }

  let sent = 0;
  let skipped = 0;
  for (const [key, msgs] of groups) {
    const [clientId, role] = key.split('|');
    const latest = msgs[msgs.length - 1];
    const toClient = role === 'Admin';
    const to = toClient ? latest.client.email : adminEmails();
    const alreadyTold = await Consultation.exists({ client: clientId, senderRole: role, readAt: null, emailSent: true });

    let delivered = false;
    if (!alreadyTold && sentToday < emailDailyCap() && to && to.length) {
      const unreadCount = await Consultation.countDocuments({ client: clientId, senderRole: role, readAt: null });
      const mail = reminderEmail({
        toClient,
        clientName: latest.client.name,
        senderName: latest.senderName,
        count: unreadCount,
        text: preview(latest),
        link: toClient ? `${siteUrl()}/dashboard/consultation` : `${siteUrl()}/admin/consultation?client=${clientId}`,
      });
      try {
        delivered = await send({ to, ...mail });
      } catch (error) {
        console.error('Chat reminder email failed:', error.message);
      }
    }

    await Consultation.updateMany({ _id: { $in: msgs.map((m) => m._id) } }, { $set: { emailedAt: now } });
    if (delivered) {
      await Consultation.updateOne({ _id: latest._id }, { $set: { emailSent: true } });
      sentToday += 1;
      sent += 1;
    } else {
      skipped += 1;
    }
  }
  return { sent, skipped };
}

/** Messages that existed before notifications launched count as already read. */
async function backfillReadState() {
  // Native driver: Mongoose refuses aggregation-pipeline updates by default.
  await Consultation.collection.updateMany(
    { readAt: { $exists: false } },
    [{ $set: { readAt: '$createdAt', emailedAt: '$createdAt', emailSent: false } }]
  );
}

let started = false;
/** Starts the reminder sweep once the database is connected (not in tests). */
function startChatNotifier() {
  if (started || process.env.NODE_ENV === 'test') return;
  started = true;
  const begin = async () => {
    try {
      await backfillReadState();
    } catch (error) {
      console.error('Chat read-state backfill failed:', error.message);
    }
    const tick = () => runEmailSweep().catch((error) => console.error('Chat email sweep failed:', error.message));
    setInterval(tick, minutes(2)).unref();
    tick();
  };
  if (mongoose.connection.readyState === 1) begin();
  else mongoose.connection.once('open', begin);
}

module.exports = { pushConfig, notifyNewMessage, runEmailSweep, backfillReadState, startChatNotifier, preview };
