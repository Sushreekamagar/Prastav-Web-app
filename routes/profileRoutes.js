const express = require('express');
const router = express.Router();

const {
  getProfile,
  updateProfile,
  updateLocation,
  updateEsewa,
  updateKhalti,
  updateEsewaQR,
  updateKhaltiQR,
  updateProfileImage,
} = require('../controllers/profileController');

const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  uploadProfileImage,
  uploadEsewaQR,
  uploadKhaltiQR,
  handleMulterError,
} = require('../middleware/uploadMiddleware');

const {
  validateUpdateProfile,
  validateUpdateLocation,
  validatePaymentNumber,
  validateImageUpload,
} = require('../validators/profileValidator');

/**
 * Profile Routes — mounted at /api in server.js
 * All routes require JWT via protect middleware.
 */

router.get('/profile', protect, getProfile);
router.put('/profile', protect, validateUpdateProfile, updateProfile);
router.put('/profile/location', protect, validateUpdateLocation, updateLocation);
router.put('/profile/esewa', protect, validatePaymentNumber('esewaNumber'), updateEsewa);
router.put('/profile/khalti', protect, validatePaymentNumber('khaltiNumber'), updateKhalti);

router.put(
  '/profile/esewaQR',
  protect,
  restrictTo('seller'),
  uploadEsewaQR.single('esewaQR'),
  handleMulterError,
  validateImageUpload,
  updateEsewaQR
);

router.put(
  '/profile/khaltiQR',
  protect,
  restrictTo('seller'),
  uploadKhaltiQR.single('khaltiQR'),
  handleMulterError,
  validateImageUpload,
  updateKhaltiQR
);

router.put(
  '/profile/image',
  protect,
  uploadProfileImage.single('profileImage'),
  handleMulterError,
  validateImageUpload,
  updateProfileImage
);

module.exports = router;
