// src/common/middleware/mpesa.middleware.js
// Safaricom's official callback IP ranges (production)
// Source: https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate
const SAFARICOM_IPS = [
  '196.201.214.200',
  '196.201.214.206',
  '196.201.213.114',
  '196.201.214.207',
  '196.201.214.208',
  '196.201.213.44',
  '196.201.212.127',
  '196.201.212.138',
  '196.201.212.129',
  '196.201.212.136',
  '196.201.212.74',
  '196.201.212.69',
];

function validateMpesaCallback(req, res, next) {
  // In development/sandbox, skip IP check
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const ip = (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.socket.remoteAddress ||
    ''
  ).trim();

  if (!SAFARICOM_IPS.includes(ip)) {
    console.warn(`[M-Pesa] Blocked callback from unauthorized IP: ${ip}`);
    return res.status(403).json({ ResultCode: 1, ResultDesc: 'Forbidden' });
  }

  next();
}

module.exports = { validateMpesaCallback };
