const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

/**
 * Validates email format using a simple regex.
 */
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * Validates MongoDB ObjectId format.
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
/**
 * Ensures req.body exists and is a plain object (express.json must parse the request first).
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
 * validateSignup — Request body validation for POST /signup
 */
const validateSignup = (req, res, next) => {
  const body = getBody(req, res, next);
  if (!body) return;

  const { name, email, password, role } = body;

  if (!name || !name.trim()) {
    return next(new AppError('Name is required.', 400));
  }
  if (!email || !isValidEmail(email)) {
    return next(new AppError('A valid email address is required.', 400));
  }
  if (!password || password.length < 6) {
    return next(new AppError('Password must be at least 6 characters.', 400));
  }
  if (role && !['buyer', 'seller'].includes(role)) {
    return next(new AppError('Role must be either "buyer" or "seller".', 400));
  }

  next();
};

/**
 * validateVerifyOtp — Request body validation for POST /verify-otp
 */
const validateVerifyOtp = (req, res, next) => {
  const body = getBody(req, res, next);
  if (!body) return;

  const { userId, otp } = body;

  if (!userId) {
    return next(new AppError('userId is required.', 400));
  }
  if (!isValidObjectId(userId)) {
    return next(
      new AppError(
        'userId must be a valid MongoDB ID. Copy the userId from your signup response — do not use placeholder text.',
        400
      )
    );
  }
  if (!otp || !/^\d{6}$/.test(String(otp))) {
    return next(new AppError('A valid 6-digit OTP is required.', 400));
  }

  next();
};

/**
 * validateLogin — Request body validation for POST /login
 */
const validateLogin = (req, res, next) => {
  const body = getBody(req, res, next);
  if (!body) return;

  const { email, password } = body;

  if (!email || !password) {
    return next(new AppError('Email and password are required.', 400));
  }

  next();
};

/**
 * validateForgotPassword — Request body validation for POST /forgot-password
 */
const validateForgotPassword = (req, res, next) => {
  const body = getBody(req, res, next);
  if (!body) return;

  const { email } = body;

  if (!email || !isValidEmail(email)) {
    return next(new AppError('A valid email address is required.', 400));
  }

  next();
};

/**
 * validateResetPassword — Request body validation for POST /reset-password
 */
const validateResetPassword = (req, res, next) => {
  const body = getBody(req, res, next);
  if (!body) return;

  const { email, otp, newPassword } = body;

  if (!email || !otp) {
    return next(new AppError('email and otp are required.', 400));
  }
  if (!isValidEmail(email)) {
    return next(new AppError('A valid email address is required.', 400));
  }
  if (!newPassword || newPassword.length < 6) {
    return next(new AppError('New password must be at least 6 characters.', 400));
  }
  if (!/^\d{6}$/.test(String(otp))) {
    return next(new AppError('OTP must be a 6-digit number.', 400));
  }

  next();
};

module.exports = {
  validateSignup,
  validateVerifyOtp,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
};
