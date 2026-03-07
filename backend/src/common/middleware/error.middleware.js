function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
}

function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err.message, '\n', err.stack);
  }

  // Multer: file too large
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large. Max 5MB per image.' });
  }

  // PostgreSQL: unique violation
  if (err.code === '23505') {
    const d = err.detail || '';
    if (d.includes('phone')) return res.status(409).json({ success: false, message: 'Phone number already registered.' });
    if (d.includes('email')) return res.status(409).json({ success: false, message: 'Email already in use.' });
    return res.status(409).json({ success: false, message: 'Record already exists.' });
  }

  // PostgreSQL: check constraint
  if (err.code === '23514') {
    return res.status(400).json({ success: false, message: 'Validation failed: ' + (err.detail || 'invalid value') });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'An unexpected error occurred.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { notFoundHandler, errorHandler };
