function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
}

function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV !== 'production';

  // Always log internally
  console.error(`[Error] ${req.method} ${req.path} — ${err.message}`);
  if (isDev) console.error(err.stack);

  // PostgreSQL unique violation
  if (err.code === '23505') {
    const d = err.detail || '';
    if (d.includes('phone')) return res.status(409).json({ success: false, message: 'Phone number already registered.' });
    if (d.includes('email')) return res.status(409).json({ success: false, message: 'Email already in use.' });
    return res.status(409).json({ success: false, message: 'Already exists.' });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ success: false, message: 'Referenced resource not found.' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  }

  // Validation errors from express-validator
  if (err.type === 'validation') {
    return res.status(400).json({ success: false, message: err.message });
  }

  const status = err.status || err.statusCode || 500;

  // In production — never expose internal error details
  const message = isDev
    ? err.message || 'An unexpected error occurred.'
    : status >= 500
      ? 'An unexpected error occurred. Please try again.'
      : err.message || 'Request failed.';

  res.status(status).json({
    success: false,
    message,
    // Only include stack trace in development
    ...(isDev && status >= 500 && { stack: err.stack }),
  });
}

module.exports = { notFoundHandler, errorHandler };
