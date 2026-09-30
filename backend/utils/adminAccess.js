function adminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email) {
  return adminEmails().includes(String(email || '').trim().toLowerCase());
}

// Marketing head(s) — e.g. MD Khalid. Same comma-separated env pattern as admins.
// These users get access to the social-automation tools.
function marketingHeadEmails() {
  return (process.env.MARKETING_HEAD_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isMarketingHeadEmail(email) {
  return marketingHeadEmails().includes(String(email || '').trim().toLowerCase());
}

module.exports = {
  adminEmails,
  isAdminEmail,
  marketingHeadEmails,
  isMarketingHeadEmail
};
