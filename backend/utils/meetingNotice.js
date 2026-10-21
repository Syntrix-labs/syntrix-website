const Consultation = require('../models/Consultation');
const User = require('../models/User');
const { sendMail } = require('./mailer');
const { announceMessage, pushToUsers, escapeHtml, siteUrl } = require('./chatNotifier');
const { emailLayout } = require('./emailLayout');

/**
 * Telling a client about a meeting an admin arranged for them:
 *  - a chat message (instant push to their phone; links are clickable),
 *  - one email with the details + "Add to Google Calendar",
 *  - a push to the team members invited to join.
 * Meetings are entered in Indian time (the form says IST).
 */

// Swappable so tests can capture emails instead of sending them.
const mailer = { send: sendMail };

const IST_OFFSET_MS = 330 * 60 * 1000;
const DEFAULT_LENGTH_MS = 45 * 60 * 1000;

/** "2026-10-25" + "19:00" (IST) → Date, or null if unreadable. */
function startOf(date, time) {
  const [y, m, d] = String(date || '').split('-').map(Number);
  const [h, mi] = String(time || '').split(':').map(Number);
  if (!y || !m || !d || Number.isNaN(h)) return null;
  return new Date(Date.UTC(y, m - 1, d, h, mi || 0) - IST_OFFSET_MS);
}

/** "Thu 5 Nov 2026, 6:30 pm IST" */
function whenLabel(start) {
  const day = start.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const time = start.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' });
  return `${day.replace(/,/g, '')}, ${time} IST`;
}

function googleCalendarLink({ title, start, details, location }) {
  const stamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const end = new Date(start.getTime() + DEFAULT_LENGTH_MS);
  const q = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${stamp(start)}/${stamp(end)}`, details, location: location || '' });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

const isUrl = (s) => /^https?:\/\//i.test(String(s || ''));

async function announceMeeting({ io, meeting, client, scheduler }) {
  const start = startOf(meeting.date, meeting.time);
  const when = start ? whenLabel(start) : `${meeting.date} at ${meeting.time}`;
  const link = isUrl(meeting.meetingLink) ? meeting.meetingLink : '';
  const how = meeting.meetingPlatform || 'Google Meet';

  // 1. Chat message → instant push. Marked as already emailed so the
  //    unread-reminder sweep doesn't send a second email about it.
  const message = await Consultation.create({
    client: client._id,
    senderRole: 'Admin',
    senderName: scheduler?.name,
    message: `📅 Meeting scheduled: "${meeting.title}" — ${when} on ${how}.${link ? ` Join here: ${link}` : ' The joining link will be shared here.'}${meeting.notes ? ` Note: ${meeting.notes}` : ''}`,
    emailedAt: new Date(),
  });
  announceMessage(io, message, scheduler);

  // 2. One email to the client.
  const first = escapeHtml(String(client.name || 'there').split(' ')[0]);
  const meetingsPage = `${siteUrl()}/dashboard/meetings`;
  const calendar = start
    ? googleCalendarLink({
        title: `${meeting.title} — Syntrix Labs`,
        start,
        details: `${link ? `Join: ${link}\n` : ''}Your meetings: ${meetingsPage}`,
        location: link,
      })
    : '';
  const html = emailLayout({
    heading: `Your meeting is booked, ${first}`,
    paragraphs: [
      `${escapeHtml(scheduler?.name || 'The Syntrix team')} scheduled a meeting with you.`,
      `<strong>${escapeHtml(meeting.title)}</strong><br/>${escapeHtml(when)} · ${escapeHtml(how)}`,
      link ? 'Use the button below to join at the meeting time.' : "We'll send the joining link before the meeting — it will also appear in your dashboard.",
    ],
    quote: meeting.notes,
    cta: link ? { href: link, label: 'Join meeting' } : { href: meetingsPage, label: 'View my meetings' },
    extra: calendar
      ? `<p style="margin:18px 0 0;font-size:13px"><a href="${escapeHtml(calendar)}" style="color:#34d399">+ Add to Google Calendar</a></p>`
      : '',
  });
  const text = [
    `Your meeting is booked, ${String(client.name || 'there').split(' ')[0]}`,
    '',
    `${meeting.title} — ${when} (${how})`,
    link ? `Join: ${link}` : "We'll share the joining link before the meeting.",
    meeting.notes ? `Note: ${meeting.notes}` : '',
    calendar ? `Add to Google Calendar: ${calendar}` : '',
    `Your meetings: ${meetingsPage}`,
  ].join('\n');
  let emailed = false;
  try {
    emailed = await mailer.send({ to: client.email, subject: `Meeting scheduled: ${meeting.title} — ${when}`, html, text });
  } catch (error) {
    console.error('Meeting email failed:', error.message);
  }

  // 3. Team members invited to join get a push.
  if (meeting.assignees?.length) {
    const team = await User.find({ email: { $in: meeting.assignees } }).select('_id');
    pushToUsers(team.map((u) => String(u._id)), {
      title: 'You joined a client meeting',
      body: `${meeting.title} with ${client.name || 'a client'} · ${when}`,
      url: '/admin/meetings',
      tag: `meeting-${meeting._id}`,
    }).catch(() => {});
  }

  return { emailed, message };
}

module.exports = { mailer, announceMeeting, startOf, whenLabel };
