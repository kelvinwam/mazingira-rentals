const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');

const listingValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('bedrooms').isInt({ min: 1 }).withMessage('Bedrooms must be at least 1'),
  body('bathrooms').isInt({ min: 1 }).withMessage('Bathrooms must be at least 1'),
];

// GET /api/listings — public: only verified listings
const getVerifiedListings = async (req, res) => {
  try {
    const { location, min_price, max_price, bedrooms } = req.query;
    let query = `
      SELECT l.*, u.name AS landlord_name, u.phone AS landlord_phone
      FROM listings l
      JOIN users u ON l.landlord_id = u.id
      WHERE l.status = 'verified'
    `;
    const params = [];

    if (location) {
      params.push(`%${location}%`);
      query += ` AND l.location ILIKE $${params.length}`;
    }
    if (min_price) {
      params.push(Number(min_price));
      query += ` AND l.price >= $${params.length}`;
    }
    if (max_price) {
      params.push(Number(max_price));
      query += ` AND l.price <= $${params.length}`;
    }
    if (bedrooms) {
      params.push(Number(bedrooms));
      query += ` AND l.bedrooms = $${params.length}`;
    }

    query += ' ORDER BY l.verified_at DESC';

    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (err) {
    console.error('getVerifiedListings error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/listings/:id — public: single verified listing
const getListingById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT l.*, u.name AS landlord_name, u.phone AS landlord_phone
       FROM listings l
       JOIN users u ON l.landlord_id = u.id
       WHERE l.id = $1 AND l.status = 'verified'`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('getListingById error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/listings — landlord: create listing (starts as pending)
const createListing = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, price, location, bedrooms, bathrooms, amenities, image_url } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO listings (landlord_id, title, description, price, location, bedrooms, bathrooms, amenities, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.user.id, title, description, price, location, bedrooms, bathrooms, amenities || null, image_url || null]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createListing error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/listings/:id — landlord: update own pending listing
const updateListing = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { title, description, price, location, bedrooms, bathrooms, amenities, image_url } = req.body;

  try {
    const existing = await pool.query(
      'SELECT * FROM listings WHERE id = $1 AND landlord_id = $2',
      [id, req.user.id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found or not yours' });
    }
    if (existing.rows[0].status === 'verified') {
      return res.status(400).json({ message: 'Cannot edit a verified listing' });
    }

    const result = await pool.query(
      `UPDATE listings
       SET title=$1, description=$2, price=$3, location=$4, bedrooms=$5, bathrooms=$6,
           amenities=$7, image_url=$8, status='pending', verified_at=NULL
       WHERE id=$9 AND landlord_id=$10
       RETURNING *`,
      [title, description, price, location, bedrooms, bathrooms, amenities || null, image_url || null, id, req.user.id]
    );
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('updateListing error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/listings/:id — landlord: delete own listing
const deleteListing = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM listings WHERE id = $1 AND landlord_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found or not yours' });
    }
    return res.json({ message: 'Listing deleted' });
  } catch (err) {
    console.error('deleteListing error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/landlord/listings — landlord: view own listings (all statuses)
const getLandlordListings = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM listings WHERE landlord_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('getLandlordListings error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/listings — admin: view all listings with filters
const getAllListingsAdmin = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT l.*, u.name AS landlord_name, u.email AS landlord_email, u.phone AS landlord_phone
      FROM listings l
      JOIN users u ON l.landlord_id = u.id
    `;
    const params = [];

    if (status && ['pending', 'verified', 'rejected'].includes(status)) {
      params.push(status);
      query += ` WHERE l.status = $${params.length}`;
    }

    query += ' ORDER BY l.created_at DESC';
    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (err) {
    console.error('getAllListingsAdmin error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/admin/listings/:id/verify — admin: verify a listing
const verifyListing = async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body || {};

  try {
    const listing = await pool.query('SELECT * FROM listings WHERE id = $1', [id]);
    if (listing.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const result = await pool.query(
      `UPDATE listings SET status='verified', verified_at=NOW() WHERE id=$1 RETURNING *`,
      [id]
    );

    await pool.query(
      'INSERT INTO verification_logs (listing_id, admin_id, action, notes) VALUES ($1, $2, $3, $4)',
      [id, req.user.id, 'verified', notes || null]
    );

    return res.json({ listing: result.rows[0], message: 'Listing verified successfully' });
  } catch (err) {
    console.error('verifyListing error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/admin/listings/:id/reject — admin: reject a listing
const rejectListing = async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body || {};

  try {
    const listing = await pool.query('SELECT * FROM listings WHERE id = $1', [id]);
    if (listing.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const result = await pool.query(
      `UPDATE listings SET status='rejected', verified_at=NULL WHERE id=$1 RETURNING *`,
      [id]
    );

    await pool.query(
      'INSERT INTO verification_logs (listing_id, admin_id, action, notes) VALUES ($1, $2, $3, $4)',
      [id, req.user.id, 'rejected', notes || null]
    );

    return res.json({ listing: result.rows[0], message: 'Listing rejected' });
  } catch (err) {
    console.error('rejectListing error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/listings/:id/logs — admin: view verification history for a listing
const getVerificationLogs = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT vl.*, u.name AS admin_name
       FROM verification_logs vl
       JOIN users u ON vl.admin_id = u.id
       WHERE vl.listing_id = $1
       ORDER BY vl.created_at DESC`,
      [id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('getVerificationLogs error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  listingValidation,
  getVerifiedListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  getLandlordListings,
  getAllListingsAdmin,
  verifyListing,
  rejectListing,
  getVerificationLogs,
};
