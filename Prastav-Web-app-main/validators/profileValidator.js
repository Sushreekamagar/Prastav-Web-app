const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

/**
 * Ensures req.body exists for JSON profile update routes.
 */
const getBody = (req, res, next) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return next(
      new AppError(
        'Request body is required. Send JSON with Content-Type: application/json.',
        400
      )
    );
  }
  return req.body;
};

/**
 * validateUpdateProfile — PUT /profile
 */
const validateUpdateProfile = (req, res, next) => {
  const body = getBody(req, res, next);
  if (!body) return;

  const { name, grade, role } = body;

  if (name !== undefined && (!name || !String(name).trim())) {
    return next(new AppError('Name cannot be empty.', 400));
  }
  if (role !== undefined && !['buyer', 'seller'].includes(role)) {
    return next(new AppError('Role must be either "buyer" or "seller".', 400));
  }
  if (grade !== undefined && grade !== null && !String(grade).trim()) {
    return next(new AppError('Grade cannot be empty when provided.', 400));
  }

  next();
};

/**
 * validateUpdateLocation — PUT /profile/location
 */
const validateUpdateLocation = (req, res, next) => {
  const body = getBody(req, res, next);
  if (!body) return;

  const { latitude, longitude } = body;

  if (latitude === undefined || longitude === undefined) {
    return next(new AppError('latitude and longitude are required.', 400));
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return next(new AppError('latitude and longitude must be valid numbers.', 400));
  }
  if (lat < -90 || lat > 90) {
    return next(new AppError('latitude must be between -90 and 90.', 400));
  }
  if (lng < -180 || lng > 180) {
    return next(new AppError('longitude must be between -180 and 180.', 400));
  }

  next();
};

/**
 * validatePaymentNumber — PUT /profile/esewa or /profile/khalti
 */
const validatePaymentNumber = (fieldName) => (req, res, next) => {
  const body = getBody(req, res, next);
  if (!body) return;

  const value = body[fieldName];

  if (!value || !String(value).trim()) {
    return next(new AppError(`${fieldName} is required.`, 400));
  }

  next();
};

/**
 * validateImageUpload — Ensures Multer attached a file.
 */
const validateImageUpload = (req, res, next) => {
  if (!req.file) {
    return next(new AppError('An image file is required.', 400));
  }
  next();
};

module.exports = {
  validateUpdateProfile,
  validateUpdateLocation,
  validatePaymentNumber,
  validateImageUpload,
};
