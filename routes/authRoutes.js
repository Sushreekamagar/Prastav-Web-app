const express = require('express');
const router = express.Router();

const {
  signup,
  verifyOtp,
  login,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');

const {
  validateSignup,
  validateVerifyOtp,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} = require('../validators/authValidator');

/**
 * Auth Routes — public endpoints (no JWT required).
 * Flow: Route → Validator → Controller → Service → Model → MongoDB
 */

router.post('/signup', validateSignup, signup);
router.post('/verify-otp', validateVerifyOtp, verifyOtp);
router.post('/login', validateLogin, login);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);

module.exports = router;
