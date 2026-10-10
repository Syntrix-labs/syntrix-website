const mongoose = require('mongoose');
const Project = require('../models/Project');
const Consultation = require('../models/Consultation');
const User = require('../models/User');
const { sendMail } = require('./mailer');
const { pushToUsers, escapeHtml, siteUrl } = require('./chatNotifier');

/**
 * Project assignment workflow: who is doing the work, the deadline, and the
 * hand-over the client approves in chat.
 *
 * Email is used for the moments a team member must act on (assigned, deadline
 * moved, 24h left, client asked for changes / approved) — a handful per
 * project, so it stays well inside the Resend quota.
 */

// Swappable so tests can capture emails instead of sending them.
const mailer = { send: sendMail };

const REMINDER_BEFORE_MS = 24 * 60 * 60 * 1000;

/** "12 Oct 2026, 6:00 pm IST" — the team works on Indian time. */
function deadlineLabel(date) {
  if (!date) return 'No deadline set';
  const label = new Date(date).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${label} IST`;
}

function emailLayout({ heading, paragraphs, quote, cta }) {
  const body = paragraphs
    .map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#cfe8d6">${p}</p>`)
    .join('');
  const quoteHtml = quote
    ? `<p style="margin:0 0 18px;padding:14px 16px;border-left:3px solid #34d399;background:#0c2a1d;border-radius:8px;font-size:15px;line-height:1.6;color:#eafff2">${escapeHtml(quote)}</p>`
    : '';
  return `
  <div style="margin:0;padding:24px;background:#04140d;font-family:Helvetica,Arial,sans-serif">
    <div style="max-width:540px;margin:0 auto;background:#0a1f16;border:1px solid #16352a;border-radius:16px;overflow:hidden">
      <div style="padding:22px 28px;border-bottom:1px solid #16352a">
        <p style="margin:0;font-size:12px;letter-spacing:4px;color:#7f9a86">SYNTRIX LABS</p>
      </div>
      <div style="padding:28px">
        <h1 style="margin:0 0 16px;font-size:21px;font-weight:500;color:#eafff2">${heading}</h1>
        ${body}${quoteHtml}
        <a href="${cta.href}" style="display:inline-block;margin-top:6px;padding:12px 22px;border-radius:12px;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px">${cta.label}</a>
      </div>
    </div>
  </div>`;
}

/** Sends one workflow email to the project's assignee. Never throws. */
async function emailAssignee(project, kind, extra = {}) {
  const to = project.assignee && project.assignee.email;
  if (!to) return false;
  const first = escapeHtml(String(project.assignee.name || 'there').split(' ')[0]);
  const title = escapeHtml(project.title);
  const due = escapeHtml(deadlineLabel(project.dueDate));
  const client = escapeHtml(extra.clientName || 'the client');
  const link = `${siteUrl()}/admin/my-projects`;
  const cta = { href: link, label: 'Open my projects' };

  const templates = {
    assigned: {
      subject: `New project for you: ${project.title}`,
      heading: `You've got a new project, ${first}`,
      paragraphs: [
        `You've been assigned <strong>${title}</strong> for ${client}.`,
        `Deadline: <strong>${due}</strong>`,
        'When the work is ready, open My projects and tap <strong>Finish job</strong> to hand it over to the client.',
      ],
      quote: project.description,
    },
    deadline: {
      subject: `Deadline changed: ${project.title}`,
      heading: 'The deadline has changed',
      paragraphs: [`The deadline for <strong>${title}</strong> is now <strong>${due}</strong>.`],
    },
    reminder: {
      subject: `24 hours left: ${project.title}`,
      heading: `Less than 24 hours left, ${first}`,
      paragraphs: [
        `<strong>${title}</strong> is due <strong>${due}</strong>.`,
        'Please finish and hand it over to the client before the deadline.',
      ],
    },
    approved: {
      subject: `Client approved: ${project.title} 🎉`,
      heading: 'The client approved your work 🎉',
      paragraphs: [`${client} marked <strong>${title}</strong> as done. Great work!`],
    },
    changes: {
      subject: `Changes requested: ${project.title}`,
      heading: 'The client asked for changes',
      paragraphs: [`${client} reviewed <strong>${title}</strong> and asked for some changes. Deadline: <strong>${due}</strong>.`],
      quote: extra.note,
    },
  };
  const t = templates[kind];
  if (!t) return false;

  const html = emailLayout({ heading: t.heading, paragraphs: t.paragraphs, quote: t.quote, cta });
  const text = [
    t.heading.replace(/<[^>]+>/g, ''),
    '',
    ...t.paragraphs.map((p) => p.replace(/<[^>]+>/g, '')),
    t.quote ? `\n"${t.quote}"` : '',
    '',
    `Open: ${link}`,
  ].join('\n');

  try {
    return await mailer.send({ to, subject: t.subject, html, text });
  } catch (error) {
    console.error(`Project email (${kind}) failed:`, error.message);
    return false;
  }
}

/** Push a notification to the assignee's devices (installed app / browser). */
async function pushAssignee(project, payload) {
  const email = project.assignee && project.assignee.email;
  if (!email) return 0;
  const user = await User.findOne({ email }).select('_id');
  return user ? pushToUsers([String(user._id)], payload) : 0;
}

/** Withdraw a hand-over that's waiting for the client (e.g. the assignee changed). */
async function cancelPendingHandover(project) {
  if (project.handover && project.handover.status === 'submitted') {
    project.handover.status = 'none';
  }
  await Consultation.updateMany(
    { project: project._id, kind: 'handover', handoverState: 'pending' },
    { $set: { handoverState: 'cancelled' } }
  );
}

/**
 * Put `member` (a TeamMember doc, or null) on the project. The current
 * assignee moves to the history with `outcome` ('reassigned' | 'disapproved').
 * Caller saves the project.
 */
async function setAssignee(project, member, { outcome = 'reassigned', reason } = {}) {
  const now = new Date();
  const prev = project.assignee;
  if (prev && prev.email) {
    project.assignmentHistory.push({
      member: prev.member,
      name: prev.name,
      role: prev.role,
      email: prev.email,
      assignedAt: prev.assignedAt,
      endedAt: now,
      outcome,
      reason: reason ? String(reason).slice(0, 500) : undefined,
    });
  }
  project.assignee = member
    ? {
        member: member._id,
        name: member.name,
        role: member.role,
        email: String(member.email || '').trim().toLowerCase() || undefined,
        assignedAt: now,
      }
    : undefined;
  project.deadlineReminderSentAt = undefined;
  await cancelPendingHandover(project);
}

/** What a client may see: no internal history or team emails. */
function forClient(project) {
  const p = typeof project.toObject === 'function' ? project.toObject() : { ...project };
  delete p.assignmentHistory;
  delete p.deadlineReminderSentAt;
  if (p.assignee) p.assignee = { name: p.assignee.name, role: p.assignee.role };
  return p;
}

/** What a team member may see: no history of who was disapproved. */
function forTeam(project) {
  const p = typeof project.toObject === 'function' ? project.toObject() : { ...project };
  delete p.assignmentHistory;
  return p;
}

/**
 * Email assignees whose deadline is under 24h away and who haven't handed
 * over yet — once per deadline. Safe to run often.
 */
async function runDeadlineReminders({ now = new Date() } = {}) {
  const due = await Project.find({
    'assignee.email': { $exists: true, $ne: null },
    status: { $ne: 'Completed' },
    'handover.status': { $in: ['none', 'changes', null] },
    deadlineReminderSentAt: null,
    dueDate: { $gt: now, $lte: new Date(now.getTime() + REMINDER_BEFORE_MS) },
  });
  let sent = 0;
  for (const project of due) {
    // Mark first so a slow/failed email can't cause repeats.
    project.deadlineReminderSentAt = now;
    await project.save();
    if (await emailAssignee(project, 'reminder')) sent += 1;
    pushAssignee(project, {
      title: '24 hours left',
      body: `${project.title} is due ${deadlineLabel(project.dueDate)}`,
      url: '/admin/my-projects',
      tag: `deadline-${project._id}`,
    }).catch(() => {});
  }
  return sent;
}

let reminderTimer = null;
function startDeadlineReminders() {
  if (process.env.NODE_ENV === 'test' || reminderTimer) return;
  const tick = () => {
    if (mongoose.connection.readyState !== 1) return;
    runDeadlineReminders().catch((error) => console.error('Deadline reminders failed:', error.message));
  };
  reminderTimer = setInterval(tick, 10 * 60 * 1000);
  if (reminderTimer.unref) reminderTimer.unref();
  setTimeout(tick, 30 * 1000);
}

module.exports = {
  mailer,
  deadlineLabel,
  emailAssignee,
  pushAssignee,
  setAssignee,
  cancelPendingHandover,
  forClient,
  forTeam,
  runDeadlineReminders,
  startDeadlineReminders,
};
