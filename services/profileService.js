const User = require('../models/User');
const AppError = require('../utils/AppError');
const { formatSafeUser } = require('./authService');

/**
 * Profile Service — business logic for user profile management.
 */

const getProfile = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return formatSafeUser(user);
};

const updateProfile = async (userId, body) => {
  const { name, grade, role, district, preferencesSet, preferences, sellerPreferences, esewaNumber, khaltiNumber, esewaQR, khaltiQR } = body;
  const updates = {};

  if (name !== undefined) updates.name = String(name).trim();
  if (grade !== undefined) updates.grade = grade === null ? null : String(grade).trim();
  if (role !== undefined) updates.role = role;
  if (district !== undefined) updates.district = district === null ? null : String(district).trim();
  if (preferencesSet !== undefined) updates.preferencesSet = Boolean(preferencesSet);
  if (preferences !== undefined) updates.preferences = preferences;
  if (sellerPreferences !== undefined) updates.sellerPreferences = sellerPreferences;
  if (esewaNumber !== undefined) updates.esewaNumber = esewaNumber === null ? null : String(esewaNumber).trim();
  if (khaltiNumber !== undefined) updates.khaltiNumber = khaltiNumber === null ? null : String(khaltiNumber).trim();
  if (esewaQR !== undefined) updates.esewaQR = esewaQR;
  if (khaltiQR !== undefined) updates.khaltiQR = khaltiQR;

  const user = await User.findByIdAndUpdate(userId, updates, {
    returnDocument: 'after',
    runValidators: true,
  });

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return formatSafeUser(user);
};


/**
 * updateLocation — Stores GeoJSON Point [longitude, latitude] for nearby features.
 */
const updateLocation = async (userId, { latitude, longitude }) => {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  const user = await User.findByIdAndUpdate(
    userId,
    {
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
    },
    { returnDocument: 'after', runValidators: true }
  );

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return formatSafeUser(user);
};

const updateEsewaNumber = async (userId, esewaNumber) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { esewaNumber: String(esewaNumber).trim() },
    { returnDocument: 'after', runValidators: true }
  );

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return formatSafeUser(user);
};

const updateKhaltiNumber = async (userId, khaltiNumber) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { khaltiNumber: String(khaltiNumber).trim() },
    { returnDocument: 'after', runValidators: true }
  );

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return formatSafeUser(user);
};

/**
 * updateImageField — Saves uploaded file path to MongoDB.
 * Path is relative URL served by express.static('/uploads').
 */
const updateImageField = async (userId, field, subfolder, filename) => {
  const imagePath = `/uploads/${subfolder}/${filename}`;

  const user = await User.findByIdAndUpdate(
    userId,
    { [field]: imagePath },
    { returnDocument: 'after', runValidators: true }
  );

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return formatSafeUser(user);
};

const updateProfileImage = async (userId, filename) =>
  updateImageField(userId, 'profileImage', 'profiles', filename);

const updateEsewaQR = async (userId, filename) =>
  updateImageField(userId, 'esewaQR', 'esewa-qr', filename);

const updateKhaltiQR = async (userId, filename) =>
  updateImageField(userId, 'khaltiQR', 'khalti-qr', filename);

/**
 * switchRole — Allows a user to switch their role between buyer, seller, or both.
 * Admin role cannot be changed via this endpoint.
 */
const switchRole = async (userId, newRole) => {
  const ALLOWED_ROLES = ['buyer', 'seller', 'both'];

  if (!ALLOWED_ROLES.includes(newRole)) {
    throw new AppError(`Invalid role. Allowed: ${ALLOWED_ROLES.join(', ')}.`, 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (user.role === 'admin') {
    throw new AppError('Admin role cannot be changed.', 403);
  }

  if (user.role === newRole) {
    throw new AppError(`You are already a ${newRole}.`, 400);
  }

  user.role = newRole;
  await user.save({ validateBeforeSave: false });

  return formatSafeUser(user);
};

module.exports = {
  getProfile,
  updateProfile,
  updateLocation,
  updateEsewaNumber,
  updateKhaltiNumber,
  updateProfileImage,
  updateEsewaQR,
  updateKhaltiQR,
  switchRole,
};
