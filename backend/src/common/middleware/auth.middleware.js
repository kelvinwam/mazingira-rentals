const jwt    = require('jsonwebtoken');
const { query } = require('../../database/connection');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  try {
    req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `Requires role: ${roles.join(' or ')}` });
    }
    next();
  };
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();
  try { req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET); }
  catch { /* ignore */ }
  next();
}

async function ownsListing(req, res, next) {
  const r = await query('SELECT landlord_id FROM apartments WHERE id = $1', [req.params.id]);
  if (!r.rows[0])                          return res.status(404).json({ success: false, message: 'Listing not found.' });
  if (r.rows[0].landlord_id !== req.user.sub) return res.status(403).json({ success: false, message: 'You do not own this listing.' });
  next();
}

module.exports = { authenticate, requireRole, optionalAuth, ownsListing };
