const User = require('../models/User');
const AppError = require('../utils/AppError');
const { signToken } = require('../utils/jwt');
const {
  generateOTP,
  sendOTPEmail,
  sendPasswordResetEmail,
} = require('./emailService');

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * formatSafeUser — Strips sensitive fields before sending user data in JSON responses.
 */
const formatSafeUser = (user) => ({
  _id: user._id,
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  profileImage: user.profileImage,
  grade: user.grade,
  district: user.district,
  location: user.location,
  reputationScore: user.reputationScore,
  esewaNumber: user.esewaNumber,
  khaltiNumber: user.khaltiNumber,
  esewaQR: user.esewaQR,
  khaltiQR: user.khaltiQR,
  isVerified: user.isVerified,
  status: user.status,
  isReported: user.isReported,
  preferencesSet: user.preferencesSet,
  preferences: user.preferences,
  sellerPreferences: user.sellerPreferences,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

/**
 * signup — Register a new user, hash password, generate OTP, send verification email.
 */
const signup = async (body) => {
  const { name, email, password, role } = body || {};
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });

  // Block duplicate verified accounts
  if (existing && existing.isVerified) {
    throw new AppError('This email is already registered. Please login.', 400);
  }

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);

  let user;

  // Resend OTP if user registered before but never verified
  if (existing && !existing.isVerified) {
    existing.name = name.trim();
    existing.password = password;
    existing.role = role || 'buyer';
    existing.otp = otp;
    existing.otpExpiry = otpExpiry;
    await existing.save();
    user = existing;
  } else {
    user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: role || 'buyer',
      otp,
      otpExpiry,
    });
  }

  await sendOTPEmail(normalizedEmail, otp, user.name);

  return {
    userId: user._id,
    message: 'Registration successful! OTP sent to your email.',
  };
};

/**
 * verifyOtp — Validate OTP and activate the user account.
 * OTP Lockout: 5 wrong attempts → 2-minute lock (independent of login lockout).
 */
const verifyOtp = async (body) => {
  const { userId, otp } = body || {};
  const user = await User.findById(userId).select('+otp +otpExpiry +otpAttempts +otpLockUntil');

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (user.isVerified) {
    throw new AppError('Account is already verified. Please login.', 400);
  }

  // ── OTP Lockout Check ────────────────────────────────────────────────────
  if (user.otpLockUntil && user.otpLockUntil > Date.now()) {
    const secsLeft = Math.ceil((user.otpLockUntil - Date.now()) / 1000);
    const minsLeft = Math.ceil(secsLeft / 60);
    throw new AppError(
      `Too many incorrect OTP attempts. Please try again after ${minsLeft} minute(s).`,
      429
    );
  }

  // ── OTP Expiry Check ─────────────────────────────────────────────────────
  if (new Date() > user.otpExpiry) {
    throw new AppError(
      'OTP has expired. Please signup again to receive a new OTP.',
      400
    );
  }

  // ── Wrong OTP — increment attempt counter ────────────────────────────────
  if (user.otp !== String(otp)) {
    user.otpAttempts = (user.otpAttempts || 0) + 1;

    const MAX_OTP_ATTEMPTS = 5;
    const OTP_LOCK_MS = 2 * 60 * 1000; // 2 minutes

    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      user.otpLockUntil = new Date(Date.now() + OTP_LOCK_MS);
      user.otpAttempts = 0; // reset counter so lock is the signal
      await user.save({ validateBeforeSave: false });
      throw new AppError(
        'Too many incorrect OTP attempts. Please try again after 2 minutes.',
        429
      );
    }

    await user.save({ validateBeforeSave: false });

    const remaining = MAX_OTP_ATTEMPTS - user.otpAttempts;
    throw new AppError(
      `Invalid OTP. ${remaining} attempt(s) remaining before temporary lockout.`,
      400
    );
  }

  // ── Correct OTP — clear all OTP-related fields ───────────────────────────
  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  user.otpAttempts = 0;
  user.otpLockUntil = null;
  await user.save();

  const token = signToken(user._id);

  return {
    message: 'Email verified successfully! Welcome to Prastav.',
    token,
    user: formatSafeUser(user),
  };
};


/**
 * login — Authenticate user with email/password and return JWT.
 */
const login = async (body) => {
  const { email, password } = body || {};
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    '+password +loginAttempts +lockUntil'
  );

  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (user.isLocked()) {
    const mins = Math.ceil((user.lockUntil - Date.now()) / 60000);
    throw new AppError(
      `Account locked due to too many failed attempts. Try again in ${mins} minute(s).`,
      429
    );
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    user.loginAttempts += 1;
    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      user.loginAttempts = 0;
    }
    await user.save({ validateBeforeSave: false });
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isVerified) {
    throw new AppError(
      'Please verify your email before logging in. Check your inbox for the OTP.',
      401
    );
  }

  user.loginAttempts = 0;
  user.lockUntil = null;
  await user.save({ validateBeforeSave: false });

  const token = signToken(user._id);

  return {
    message: 'Login successful!',
    token,
    user: formatSafeUser(user),
  };
};

const forgotPassword = async (body) => {
  const { email } = body || {};
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+otp +otpExpiry');

  const successMessage = 'If an account with that email exists and is verified, an OTP has been sent for password reset.';

  if (!user || !user.isVerified) {
    return { message: successMessage };
  }

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);

  user.otp = otp;
  user.otpExpiry = otpExpiry;
  await user.save({ validateBeforeSave: false });

  await sendPasswordResetEmail(normalizedEmail, otp, user.name);

  return { message: successMessage };
};

/**
 * resetPassword — Verify OTP and save a new hashed password.
 */
const resetPassword = async (body) => {
  const { email, otp, newPassword } = body || {};
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+otp +otpExpiry +password');

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (user.otp !== String(otp)) {
    throw new AppError('Invalid OTP.', 400);
  }

  if (new Date() > user.otpExpiry) {
    throw new AppError('OTP has expired. Please request a new one.', 400);
  }

  user.password = newPassword;
  user.otp = undefined;
  user.otpExpiry = undefined;
  user.loginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  const token = signToken(user._id);

  return {
    message: 'Password reset successful! You are now logged in.',
    token,
    user: formatSafeUser(user),
  };
};

/**
 * changePassword — Verify current password and update with new hashed password.
 */
const changePassword = async (userId, body) => {
  const { currentPassword, newPassword } = body || {};
  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required.', 400);
  }

  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Incorrect current password.', 401);
  }

  user.password = newPassword;
  await user.save();

  return { message: 'Password updated successfully.' };
};

module.exports = {
  signup,
  verifyOtp,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  formatSafeUser,
};

