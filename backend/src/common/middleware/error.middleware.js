function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
}

function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV === 'development') console.error(err);

  if (err.code === '23505') {
    const d = err.detail || '';
    if (d.includes('phone')) return res.status(409).json({ success: false, message: 'Phone number already registered.' });
    if (d.includes('email')) return res.status(409).json({ success: false, message: 'Email already in use.' });
    return res.status(409).json({ success: false, message: 'Already exists.' });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'An unexpected error occurred.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { notFoundHandler, errorHandler };
