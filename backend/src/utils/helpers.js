function ok(res, data, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function fail(res, message = 'Something went wrong', status = 400) {
  return res.status(status).json({ success: false, message, data: null });
}

function paginated(res, data, total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  return res.json({
    success: true,
    data,
    meta: { total, page, limit, totalPages, hasMore: page < totalPages },
  });
}

function parsePagination(query) {
  const page  = Math.max(1, parseInt(query.page  || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(query.limit || '12')));
  return { page, limit, offset: (page - 1) * limit };
}

function normalizePhone(raw) {
  let p = String(raw).replace(/[\s\-()]/g, '');
  if (p.startsWith('0'))   return '+254' + p.slice(1);
  if (p.startsWith('254')) return '+' + p;
  if (!p.startsWith('+')) return '+254' + p;
  return p;
}

function safeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

module.exports = { ok, fail, paginated, parsePagination, normalizePhone, safeUser };
