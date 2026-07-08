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

const updateProfile = async (userId, { name, grade, role }) => {
  const updates = {};

  if (name !== undefined) updates.name = String(name).trim();
  if (grade !== undefined) updates.grade = grade === null ? null : String(grade).trim();
  if (role !== undefined) updates.role = role;

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

module.exports = {
  getProfile,
  updateProfile,
  updateLocation,
  updateEsewaNumber,
  updateKhaltiNumber,
  updateProfileImage,
  updateEsewaQR,
  updateKhaltiQR,
};
