const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const User = require('../models/User');
const TeamMember = require('../models/TeamMember');
const Consultation = require('../models/Consultation');
const authMiddleware = require('../middleware/authMiddleware'); // We reuse your bouncer!
const requireAdmin = require('../middleware/adminMiddleware');
const requireStaff = require('../middleware/staffMiddleware');
const { announceMessage } = require('../utils/chatNotifier');
const {
  emailAssignee,
  pushAssignee,
  setAssignee,
  forClient,
  forTeam,
  deadlineLabel,
  startDeadlineReminders,
} = require('../utils/projectWork');

// "24 hours left" emails to assignees run in the background (not in tests).
startDeadlineReminders();

// Soonest deadline first ("least time" on top). Projects without a dueDate,
// and completed projects, sink to the bottom.
function byDeadline(a, b) {
  const done = (p) => (p.status === 'Completed' ? 1 : 0);
  if (done(a) !== done(b)) return done(a) - done(b);
  const at = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
  const bt = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
  return at - bt;
}

const clientNameOf = async (project) =>
  (project.client && project.client.name) || (await User.findById(project.client).select('name'))?.name;

/** Tell a newly assigned team member: email + push. Never blocks the response. */
function announceAssignment(project) {
  clientNameOf(project)
    .then((clientName) => emailAssignee(project, 'assigned', { clientName }))
    .catch(() => {});
  pushAssignee(project, {
    title: 'New project assigned to you',
    body: `${project.title} · due ${deadlineLabel(project.dueDate)}`,
    url: '/admin/my-projects',
    tag: `assigned-${project._id}`,
  }).catch(() => {});
}

async function findMember(memberId) {
  if (!memberId || !mongoose.isValidObjectId(memberId)) return null;
  return TeamMember.findById(memberId);
}

// @route   POST /api/projects
// @desc    Create a new project linked to the logged-in user
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { title, description, status, priority, budget, dueDate, trackingStage, clientEmail, memberId } = req.body;

    let selectedClientId = req.user.id;
    if (req.body.clientId) {
      selectedClientId = req.body.clientId;
    } else if (clientEmail) {
      const selectedClient = await User.findOne({ email: clientEmail });
      if (!selectedClient) {
        return res.status(404).json({ success: false, message: 'Client email not found' });
      }
      selectedClientId = selectedClient._id;
    }

    let member = null;
    if (memberId) {
      member = await findMember(memberId);
      if (!member) return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    // 1. Create the new project object
    const newProject = new Project({
      client: selectedClientId,
      title,
      description: description || 'Project details will be added by admin.',
      status,
      priority,
      budget,
      dueDate: dueDate || undefined,
      trackingStage
    });
    if (member) await setAssignee(newProject, member);

    // 2. Save to the database
    const project = await newProject.save();
    if (member) announceAssignment(project);

    // 3. Send the newly created project back to the frontend
    res.status(201).json({ success: true, project });

  } catch (error) {
    console.error('Create Project Error:', error);
    res.status(500).json({ message: 'Server error creating project' });
  }
});

// @route   GET /api/projects
// @desc    Get all projects for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    // 1. Tell MongoDB to find only projects where the client ID matches the token ID
    // We also use .sort() to put the newest projects at the top of the list
    const projects = await Project.find({ client: req.user.id });
    projects.sort(byDeadline);

    // 2. Send the array of projects back
    res.json(projects.map(forClient));

  } catch (error) {
    console.error('Fetch Projects Error:', error);
    res.status(500).json({ message: 'Server error fetching projects' });
  }
});

// @route   GET /api/projects/admin/all
// @desc    Get all projects for admin panel
router.get('/admin/all', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const projects = await Project.find().populate('client', 'name email');
    projects.sort(byDeadline);
    res.json(projects);
  } catch (error) {
    console.error('Fetch Admin Projects Error:', error);
    res.status(500).json({ message: 'Server error fetching admin projects' });
  }
});

// @route   GET /api/projects/assigned
// @desc    Team member: the projects assigned to me. Admins: every assigned project.
router.get('/assigned', authMiddleware, requireStaff, async (req, res) => {
  const query = req.staff.isAdmin
    ? { 'assignee.email': { $exists: true, $ne: null } }
    : { 'assignee.email': String(req.staff.email || '').toLowerCase() };
  const projects = await Project.find(query).populate('client', 'name');
  projects.sort(byDeadline);
  res.json(req.staff.isAdmin ? projects : projects.map(forTeam));
});

// @route   GET /api/projects/:id
// @desc    Get a single project
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('client', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const isOwner = String(project.client?._id || project.client) === req.user.id;
    if (!isOwner) {
      return requireAdmin(req, res, () => res.json(project));
    }

    res.json(forClient(project));
  } catch (error) {
    console.error('Fetch Project Error:', error);
    res.status(500).json({ message: 'Server error fetching project' });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update a project and trigger a notification
router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Capture the old values just to see if they changed
    const oldStatus = project.status;
    const oldDue = project.dueDate ? project.dueDate.getTime() : null;

    // Assignee, history and hand-over have their own endpoints below.
    const { assignee, assignmentHistory, handover, deadlineReminderSentAt, ...updates } = req.body;
    if ('dueDate' in updates && !updates.dueDate) updates.dueDate = null;

    project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    ).populate('client', 'name email');

    // --- NEW AUTOMATION BLOCK ---
    // If the request included a status change, automatically generate a notification!
    if (req.body.status && req.body.status !== oldStatus) {
      const statusNotification = new Notification({
        user: project.client,
        project: project._id,
        message: `Your project "${project.title}" has been moved to: ${project.status}`,
        type: 'Project Update'
      });
      await statusNotification.save();
    }

    // New deadline: re-arm the 24h reminder and tell the assignee.
    const newDue = project.dueDate ? project.dueDate.getTime() : null;
    if ('dueDate' in updates && newDue !== oldDue) {
      project.deadlineReminderSentAt = undefined;
      await project.save();
      if (project.assignee?.email && project.status !== 'Completed') {
        emailAssignee(project, 'deadline');
        pushAssignee(project, {
          title: 'Deadline changed',
          body: `${project.title} · now due ${deadlineLabel(project.dueDate)}`,
          url: '/admin/my-projects',
          tag: `deadline-${project._id}`,
        }).catch(() => {});
      }
    }
    // ----------------------------

    res.json(project);
  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).json({ message: 'Server error updating project' });
  }
});

// @route   PUT /api/projects/:id/assign
// @desc    Admin assigns (or swaps) the team member doing this project
router.put('/:id/assign', authMiddleware, requireAdmin, async (req, res) => {
  const project = await Project.findById(req.params.id).populate('client', 'name email');
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  const member = await findMember(req.body.memberId);
  if (!member) return res.status(404).json({ success: false, message: 'Team member not found' });
  if (!member.email) {
    return res.status(400).json({ success: false, message: 'This team member has no email, so they cannot sign in or be notified.' });
  }
  if (project.assignee?.member && String(project.assignee.member) === String(member._id)) {
    return res.json({ success: true, project });
  }

  await setAssignee(project, member, { outcome: 'reassigned' });
  await project.save();
  announceAssignment(project);
  res.json({ success: true, project });
});

// @route   POST /api/projects/:id/disapprove
// @desc    Admin removes the current assignee (work not done) and optionally assigns a replacement
router.post('/:id/disapprove', authMiddleware, requireAdmin, async (req, res) => {
  const project = await Project.findById(req.params.id).populate('client', 'name email');
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  if (!project.assignee?.email) {
    return res.status(400).json({ success: false, message: 'Nobody is assigned to this project.' });
  }

  let replacement = null;
  if (req.body.memberId) {
    replacement = await findMember(req.body.memberId);
    if (!replacement) return res.status(404).json({ success: false, message: 'Team member not found' });
    if (String(replacement._id) === String(project.assignee.member)) {
      return res.status(400).json({ success: false, message: 'Pick a different team member.' });
    }
  }

  await setAssignee(project, replacement, { outcome: 'disapproved', reason: req.body.reason });
  if (project.status === 'In Review') project.status = 'In Progress';
  await project.save();
  if (replacement) announceAssignment(project);
  res.json({ success: true, project });
});

// @route   POST /api/projects/:id/handover
// @desc    The assignee (or an admin) finishes the job: posts a "ready for review" card in the client's chat
router.post('/:id/handover', authMiddleware, requireStaff, async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

  const myEmail = String(req.staff.email || '').toLowerCase();
  const isAssignee = project.assignee?.email && project.assignee.email === myEmail;
  if (!isAssignee && !req.staff.isAdmin) {
    return res.status(403).json({ success: false, message: 'Only the assigned team member can hand this project over.' });
  }
  if (project.status === 'Completed' || project.handover?.status === 'approved') {
    return res.status(409).json({ success: false, message: 'This project is already completed.' });
  }
  if (project.handover?.status === 'submitted') {
    return res.status(409).json({ success: false, message: 'Already handed over — waiting for the client.' });
  }

  const me = await User.findById(req.user.id).select('name email');
  const note = typeof req.body.note === 'string' ? req.body.note.trim().slice(0, 1000) : '';
  project.handover = { status: 'submitted', by: me?.name, note, submittedAt: new Date() };
  project.status = 'In Review';
  await project.save();

  const message = await Consultation.create({
    client: project.client,
    senderRole: 'Admin',
    senderName: me?.name,
    kind: 'handover',
    project: project._id,
    projectTitle: project.title,
    handoverState: 'pending',
    message: `✅ "${project.title}" is ready for you.${note ? ` ${note}` : ''} Please check it and tap "Done — I'm satisfied", or ask for changes.`,
  });
  announceMessage(req.app.get('io'), message, me);

  res.json({ success: true, project: req.staff.isAdmin ? project : forTeam(project), message });
});

// @route   POST /api/projects/:id/handover/respond
// @desc    The client answers the hand-over: { approve: true } or { approve: false, note }
router.post('/:id/handover/respond', authMiddleware, async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  if (String(project.client) !== String(req.user.id)) {
    return res.status(403).json({ success: false, message: 'Not your project' });
  }
  if (project.handover?.status !== 'submitted') {
    return res.status(409).json({ success: false, message: 'There is nothing waiting for your approval on this project.' });
  }

  const approve = req.body.approve === true;
  const note = typeof req.body.note === 'string' ? req.body.note.trim().slice(0, 1000) : '';
  const now = new Date();
  project.handover.status = approve ? 'approved' : 'changes';
  project.handover.respondedAt = now;
  project.handover.clientNote = approve ? undefined : note;
  if (approve) {
    project.status = 'Completed';
    project.trackingStage = 'Publish';
    project.completedAt = now;
  } else {
    project.status = 'In Progress';
    project.deadlineReminderSentAt = undefined;
  }
  await project.save();

  await Consultation.updateMany(
    { project: project._id, kind: 'handover', handoverState: 'pending' },
    { $set: { handoverState: approve ? 'approved' : 'changes' } }
  );

  const me = await User.findById(req.user.id).select('name email');
  const reply = await Consultation.create({
    client: project.client,
    senderRole: 'Client',
    senderName: me?.name,
    project: project._id,
    projectTitle: project.title,
    message: approve
      ? `✅ Done — I'm satisfied with "${project.title}".`
      : `✏️ Changes requested on "${project.title}": ${note || "I'd like a few changes."}`,
  });
  announceMessage(req.app.get('io'), reply, me);
  emailAssignee(project, approve ? 'approved' : 'changes', { clientName: me?.name, note });

  res.json({ success: true, project: forClient(project), message: reply });
});

// @route   DELETE /api/projects/:id
// @desc    Delete a project
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Delete it from the database
    await project.deleteOne();
    res.json({ message: 'Project successfully removed' });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ message: 'Server error deleting project' });
  }
});

module.exports = router;
