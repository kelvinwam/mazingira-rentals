const express = require('express');
const router  = express.Router();
const { query } = require('../../database/connection');
const { authenticate, requireRole } = require('../../common/middleware/auth.middleware');
const { ok, fail } = require('../../utils/helpers');

// All payment routes require landlord auth
router.use(authenticate);
router.use(requireRole('LANDLORD'));

const BOOST_PACKAGES = [
  { days: 7,  amount: 2,  label: '1 Week',    popular: false },
  { days: 14, amount: 3,  label: '2 Weeks',   popular: true  },
  { days: 30, amount: 6,  label: '1 Month',   popular: false },
];

/* GET /payments/packages — boost packages */
router.get('/packages', (req, res) => {
  return ok(res, BOOST_PACKAGES);
});

/* GET /payments/history — landlord payment history */
router.get('/history', async (req, res) => {
  const rows = await query(
    `SELECT bp.*, a.title AS listing_title
     FROM boost_payments bp
     JOIN apartments a ON a.id=bp.apartment_id
     WHERE bp.landlord_id=$1
     ORDER BY bp.created_at DESC
     LIMIT 50`,
    [req.user.sub]
  );
  return ok(res, rows.rows);
});

/* POST /payments/boost — initiate boost payment */
router.post('/boost', async (req, res) => {
  const { apartment_id, days, phone } = req.body;

  if (!apartment_id || !days || !phone) {
    return fail(res, 'apartment_id, days and phone are required.');
  }

  // Verify landlord owns this apartment
  const apt = await query(
    `SELECT id, title, status FROM apartments WHERE id=$1 AND landlord_id=$2`,
    [apartment_id, req.user.sub]
  );
  if (!apt.rows[0]) return fail(res, 'Listing not found.');
  if (apt.rows[0].status !== 'ACTIVE') return fail(res, 'Only active listings can be boosted.');

  const pkg = BOOST_PACKAGES.find(p => p.days === parseInt(days));
  if (!pkg) return fail(res, 'Invalid boost package. Choose 7, 14 or 30 days.');

  // Normalize phone to 254XXXXXXXXX
  let normalizedPhone = phone.replace(/\s/g, '').replace(/^0/, '254').replace(/^\+/, '');
  if (!/^254[17]\d{8}$/.test(normalizedPhone)) {
    return fail(res, 'Enter a valid Safaricom number e.g. 0712345678');
  }

  // Create pending payment record
  const payment = await query(
    `INSERT INTO boost_payments
       (apartment_id, landlord_id, amount_kes, boost_days, phone, status)
     VALUES ($1,$2,$3,$4,$5,'PENDING')
     RETURNING *`,
    [apartment_id, req.user.sub, pkg.amount, pkg.days, normalizedPhone]
  );

  const paymentId = payment.rows[0].id;

  // Attempt M-Pesa STK push if credentials configured
  const hasMpesa = process.env.MPESA_CONSUMER_KEY && process.env.MPESA_CONSUMER_KEY !== 'your_key';

  if (hasMpesa) {
    try {
      const token = await getMpesaToken();
      const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
      const shortcode = process.env.MPESA_SHORTCODE;
      const passkey   = process.env.MPESA_PASSKEY;
      const password  = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

      const stkRes = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          BusinessShortCode: shortcode,
          Password:          password,
          Timestamp:         timestamp,
          TransactionType:   'CustomerPayBillOnline',
          Amount:            pkg.amount,
          PartyA:            normalizedPhone,
          PartyB:            shortcode,
          PhoneNumber:       normalizedPhone,
          CallBackURL:       `${process.env.API_URL || 'http://localhost:5000'}/v1/payments/callback`,
          AccountReference:  `MachaRent-${paymentId.slice(0, 8)}`,
          TransactionDesc:   `Boost listing for ${pkg.days} days`,
        }),
      }).then(r => r.json());

      if (stkRes.ResponseCode === '0') {
        await query(
          `UPDATE boost_payments SET checkout_id=$1 WHERE id=$2`,
          [stkRes.CheckoutRequestID, paymentId]
        );
        return ok(res, {
          payment_id:  paymentId,
          checkout_id: stkRes.CheckoutRequestID,
          message:     `M-Pesa prompt sent to ${phone}. Enter your PIN to complete payment.`,
          manual:      false,
        });
      }
    } catch (err) {
      console.error('M-Pesa STK error:', err.message);
    }
  }

  // Fallback — manual payment flow (for dev or if M-Pesa fails)
  return ok(res, {
    payment_id: paymentId,
    amount:     pkg.amount,
    phone:      normalizedPhone,
    paybill:    process.env.MPESA_SHORTCODE || '400200',
    account:    `MachaRent-${paymentId.slice(0, 8)}`,
    message:    `Send KES ${pkg.amount} via M-Pesa Paybill to complete your boost.`,
    manual:     true,
  });
});

/* POST /payments/callback — M-Pesa STK callback */
router.post('/callback', async (req, res) => {
  try {
    const callback = req.body?.Body?.stkCallback;
    if (!callback) return res.json({ ResultCode: 0 });

    const checkoutId  = callback.CheckoutRequestID;
    const resultCode  = callback.ResultCode;
    const mpesaCode   = callback.CallbackMetadata?.Item?.find(i => i.Name === 'MpesaReceiptNumber')?.Value;

    if (resultCode === 0 && mpesaCode) {
      // Payment successful
      const payment = await query(
        `UPDATE boost_payments
         SET status='COMPLETED', mpesa_code=$1,
             boost_starts_at=NOW(),
             boost_ends_at=NOW() + (boost_days || ' days')::INTERVAL,
             updated_at=NOW()
         WHERE checkout_id=$2
         RETURNING *`,
        [mpesaCode, checkoutId]
      );

      if (payment.rows[0]) {
        const p = payment.rows[0];
        // Activate boost on apartment
        await query(
          `UPDATE apartments SET is_boosted=true, boost_ends_at=$1 WHERE id=$2`,
          [p.boost_ends_at, p.apartment_id]
        );
        // Send notification to landlord
        await createNotification(p.landlord_id, 'BOOST_SUCCESS', '🚀 Listing Boosted!',
          `Your listing has been boosted for ${p.boost_days} days. M-Pesa code: ${mpesaCode}`);
      }
    } else {
      await query(
        `UPDATE boost_payments SET status='FAILED', updated_at=NOW() WHERE checkout_id=$1`,
        [checkoutId]
      );
    }
  } catch (err) {
    console.error('Callback error:', err.message);
  }
  return res.json({ ResultCode: 0, ResultDesc: 'Success' });
});

/* POST /payments/:id/confirm — manual M-Pesa code entry */
router.post('/:id/confirm', async (req, res) => {
  const { mpesa_code } = req.body;
  if (!mpesa_code) return fail(res, 'M-Pesa transaction code is required.');

  const payment = await query(
    `SELECT * FROM boost_payments WHERE id=$1 AND landlord_id=$2 AND status='PENDING'`,
    [req.params.id, req.user.sub]
  );
  if (!payment.rows[0]) return fail(res, 'Payment not found or already processed.');

  const p = payment.rows[0];

  // Mark payment complete
  const updated = await query(
    `UPDATE boost_payments
     SET status='COMPLETED', mpesa_code=$1,
         boost_starts_at=NOW(),
         boost_ends_at=NOW() + (boost_days || ' days')::INTERVAL,
         updated_at=NOW()
     WHERE id=$2
     RETURNING *`,
    [mpesa_code.toUpperCase(), p.id]
  );

  // Activate boost
  await query(
    `UPDATE apartments SET is_boosted=true, boost_ends_at=$1 WHERE id=$2`,
    [updated.rows[0].boost_ends_at, p.apartment_id]
  );

  // Notify landlord
  await createNotification(req.user.sub, 'BOOST_SUCCESS', '🚀 Listing Boosted!',
    `Your listing is now boosted for ${p.boost_days} days. Thank you!`);

  return ok(res, updated.rows[0], `Boost activated! Your listing will be featured for ${p.boost_days} days.`);
});

/* GET /payments/status/:checkoutId — poll STK status */
router.get('/status/:checkoutId', async (req, res) => {
  const payment = await query(
    `SELECT status, mpesa_code, boost_days, boost_ends_at FROM boost_payments
     WHERE checkout_id=$1 AND landlord_id=$2`,
    [req.params.checkoutId, req.user.sub]
  );
  if (!payment.rows[0]) return fail(res, 'Payment not found.', 404);
  return ok(res, payment.rows[0]);
});

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getMpesaToken() {
  const key    = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  const creds  = Buffer.from(`${key}:${secret}`).toString('base64');
  const res    = await fetch(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    { headers: { Authorization: `Basic ${creds}` } }
  ).then(r => r.json());
  return res.access_token;
}

async function createNotification(userId, type, title, body, data = {}) {
  await query(
    `INSERT INTO notifications (user_id, type, title, body, data) VALUES ($1,$2,$3,$4,$5)`,
    [userId, type, title, body, JSON.stringify(data)]
  ).catch(() => {});
}

module.exports = router;
module.exports.createNotification = createNotification;
