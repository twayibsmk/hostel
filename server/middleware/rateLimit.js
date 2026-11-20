// Blocks password guessing: 5 wrong logins -> wait 15 minutes
const attempts = new Map(); // key -> { count, since }
const MAX = 5;
const WINDOW = 15 * 60 * 1000;

function key(req) {
  return req.ip + '|' + String((req.body && req.body.email) || '').toLowerCase();
}

// Call before checking the password
function checkBlocked(req, res, next) {
  const item = attempts.get(key(req));
  if (item && Date.now() - item.since > WINDOW) attempts.delete(key(req)); // old, forget it
  else if (item && item.count >= MAX) {
    return res.status(429).json({ message: 'Too many wrong attempts. Try again after 15 minutes.' });
  }
  next();
}

function recordFail(req) {
  const k = key(req);
  const item = attempts.get(k) || { count: 0, since: Date.now() };
  item.count++;
  attempts.set(k, item);
}

function recordSuccess(req) {
  attempts.delete(key(req));
}

module.exports = { checkBlocked, recordFail, recordSuccess };
