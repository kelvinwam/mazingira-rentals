function ok(res, data = {}, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function created(res, data = {}, message = 'Created') {
  return ok(res, data, message, 201);
}

function fail(res, message = 'An error occurred', status = 400) {
  return res.status(status).json({ success: false, message });
}

function paginated(res, data, total, page, limit) {
  return res.json({
    success: true,
    data,
    meta: {
      total,
      page:       +page,
      limit:      +limit,
      totalPages: Math.ceil(total / limit),
      hasMore:    page * limit < total,
    },
  });
}

function normalizePhone(raw) {
  let p = String(raw).replace(/[\s\-()]/g, '');
  if (p.startsWith('0'))   return '+254' + p.slice(1);
  if (p.startsWith('254')) return '+' + p;
  if (!p.startsWith('+')) return '+254' + p;
  return p;
}

function parsePagination(q) {
  const page  = Math.max(1, parseInt(q.page)  || 1);
  const limit = Math.min(50, Math.max(1, parseInt(q.limit) || 12));
  return { page, limit, offset: (page - 1) * limit };
}

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function safeUser(u) {
  const { id, phone, full_name, email, role, is_phone_verified, profile_photo, created_at } = u;
  return { id, phone, full_name, email, role, is_phone_verified, profile_photo, created_at };
}

module.exports = { ok, created, fail, paginated, normalizePhone, parsePagination, generateOTP, safeUser };
