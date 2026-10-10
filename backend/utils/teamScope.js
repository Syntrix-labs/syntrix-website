const Project = require('../models/Project');

/**
 * What a team member may see of client conversations.
 *
 * Admins see every client. A team member only sees the clients whose projects
 * they are *currently* assigned to — so someone who was disapproved and taken
 * off a project loses that client's chat (and never sees who replaced them).
 */

const lower = (email) => String(email || '').trim().toLowerCase();

/** Client ids the staff member may see, or null for "all clients" (admins). */
async function visibleClientIds(staff) {
  if (!staff || staff.isAdmin) return null;
  const ids = await Project.distinct('client', { 'assignee.email': lower(staff.email) });
  return ids.map(String);
}

async function canSeeClient(staff, clientId) {
  if (!clientId) return false;
  const ids = await visibleClientIds(staff);
  return ids === null || ids.includes(String(clientId));
}

/** Emails of team members currently assigned to any of this client's projects. */
async function assignedTeamEmails(clientId) {
  const emails = await Project.distinct('assignee.email', { client: clientId });
  return emails.filter(Boolean).map(lower);
}

module.exports = { visibleClientIds, canSeeClient, assignedTeamEmails };
