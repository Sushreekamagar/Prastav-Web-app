const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');

/**
 * Auth Controller — coordinates HTTP requests and responses only.
 * All business logic is delegated to authService.js.
 */

// POST /api/auth/signup
const signup = asyncHandler(async (req, res, next) => {
  const result = await authService.signup(req.body);

  res.status(201).json({
    success: true,
    message: result.message,
    userId: result.userId,
  });
});

// POST /api/auth/verify-otp
const verifyOtp = asyncHandler(async (req, res, next) => {
  const result = await authService.verifyOtp(req.body);

  res.status(200).json({
    success: true,
    message: result.message,
    token: result.token,
    user: result.user,
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res, next) => {
  const result = await authService.login(req.body);

  res.status(200).json({
    success: true,
    message: result.message,
    token: result.token,
    user: result.user,
  });
});

// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res, next) => {
  const result = await authService.forgotPassword(req.body);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

// POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res, next) => {
  const result = await authService.resetPassword(req.body);

  res.status(200).json({
    success: true,
    message: result.message,
    token: result.token,
    user: result.user,
  });
});

// POST /api/auth/change-password
const changePassword = asyncHandler(async (req, res, next) => {
  const result = await authService.changePassword(req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

module.exports = {
  signup,
  verifyOtp,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
};

