const jwt = require('jsonwebtoken');

/**
 * Login sessions. A token lasts SESSION_TTL; anyone who keeps using the site
 * gets a fresh one (X-Refresh-Token header) once their token is a day old, so
 * active users are never logged out — only people away for 30+ days.
 */
const SESSION_TTL = '30d';
const REFRESH_AFTER_SECONDS = 24 * 60 * 60;

const signSession = (userId) => jwt.sign({ user: { id: userId } }, process.env.JWT_SECRET, { expiresIn: SESSION_TTL });

/** Attach a renewed token to the response when the current one is over a day old. */
function refreshIfOld(decoded, res) {
  const userId = decoded && decoded.user && decoded.user.id;
  if (!userId || !decoded.iat) return;
  if (Date.now() / 1000 - decoded.iat < REFRESH_AFTER_SECONDS) return;
  res.set('X-Refresh-Token', signSession(userId));
  res.append('Access-Control-Expose-Headers', 'X-Refresh-Token');
}

module.exports = { SESSION_TTL, signSession, refreshIfOld };
