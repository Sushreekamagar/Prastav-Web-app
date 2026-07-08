const asyncHandler = require('../utils/asyncHandler');
const profileService = require('../services/profileService');

/**
 * Profile Controller — coordinates HTTP requests only.
 * req.user is set by protect middleware (JWT).
 */

// GET /api/profile
const getProfile = asyncHandler(async (req, res, next) => {
  const user = await profileService.getProfile(req.user._id);

  res.status(200).json({ success: true, user });
});

// PUT /api/profile
const updateProfile = asyncHandler(async (req, res, next) => {
  const user = await profileService.updateProfile(req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    user,
  });
});

// PUT /api/profile/location
const updateLocation = asyncHandler(async (req, res, next) => {
  const user = await profileService.updateLocation(req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: 'Location updated successfully.',
    user,
  });
});

// PUT /api/profile/esewa
const updateEsewa = asyncHandler(async (req, res, next) => {
  const user = await profileService.updateEsewaNumber(
    req.user._id,
    req.body.esewaNumber
  );

  res.status(200).json({
    success: true,
    message: 'eSewa number updated successfully.',
    user,
  });
});

// PUT /api/profile/khalti
const updateKhalti = asyncHandler(async (req, res, next) => {
  const user = await profileService.updateKhaltiNumber(
    req.user._id,
    req.body.khaltiNumber
  );

  res.status(200).json({
    success: true,
    message: 'Khalti number updated successfully.',
    user,
  });
});

// PUT /api/profile/esewaQR
const updateEsewaQR = asyncHandler(async (req, res, next) => {
  const user = await profileService.updateEsewaQR(req.user._id, req.file.filename);

  res.status(200).json({
    success: true,
    message: 'eSewa QR uploaded successfully.',
    user,
  });
});

// PUT /api/profile/khaltiQR
const updateKhaltiQR = asyncHandler(async (req, res, next) => {
  const user = await profileService.updateKhaltiQR(req.user._id, req.file.filename);

  res.status(200).json({
    success: true,
    message: 'Khalti QR uploaded successfully.',
    user,
  });
});

// PUT /api/profile/image
const updateProfileImage = asyncHandler(async (req, res, next) => {
  const user = await profileService.updateProfileImage(req.user._id, req.file.filename);

  res.status(200).json({
    success: true,
    message: 'Profile image uploaded successfully.',
    user,
  });
});

module.exports = {
  getProfile,
  updateProfile,
  updateLocation,
  updateEsewa,
  updateKhalti,
  updateEsewaQR,
  updateKhaltiQR,
  updateProfileImage,
};
