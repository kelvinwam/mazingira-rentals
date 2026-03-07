const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
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
router.get('/', getVerifiedListings);
router.get('/:id', getListingById);

// Landlord routes
router.post('/', authenticate, requireRole('landlord'), listingValidation, createListing);
router.put('/:id', authenticate, requireRole('landlord'), listingValidation, updateListing);
router.delete('/:id', authenticate, requireRole('landlord'), deleteListing);
router.get('/landlord/my-listings', authenticate, requireRole('landlord'), getLandlordListings);

// Admin routes
router.get('/admin/all', authenticate, requireRole('admin'), getAllListingsAdmin);
router.patch('/admin/:id/verify', authenticate, requireRole('admin'), verifyListing);
router.patch('/admin/:id/reject', authenticate, requireRole('admin'), rejectListing);
router.get('/admin/:id/logs', authenticate, requireRole('admin'), getVerificationLogs);

module.exports = router;
