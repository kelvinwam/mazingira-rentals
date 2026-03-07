const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const {
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
} = require('../controllers/listingsController');

// Public routes
router.get('/', apiLimiter, getVerifiedListings);
router.get('/:id', apiLimiter, getListingById);

// Landlord routes
router.post('/', apiLimiter, authenticate, requireRole('landlord'), listingValidation, createListing);
router.put('/:id', apiLimiter, authenticate, requireRole('landlord'), listingValidation, updateListing);
router.delete('/:id', apiLimiter, authenticate, requireRole('landlord'), deleteListing);
router.get('/landlord/my-listings', apiLimiter, authenticate, requireRole('landlord'), getLandlordListings);

// Admin routes
router.get('/admin/all', apiLimiter, authenticate, requireRole('admin'), getAllListingsAdmin);
router.patch('/admin/:id/verify', apiLimiter, authenticate, requireRole('admin'), verifyListing);
router.patch('/admin/:id/reject', apiLimiter, authenticate, requireRole('admin'), rejectListing);
router.get('/admin/:id/logs', apiLimiter, authenticate, requireRole('admin'), getVerificationLogs);

module.exports = router;
