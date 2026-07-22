const express = require('express');
const router = express.Router();

const {
  signup,
  verifyOtp,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

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
router.post('/change-password', protect, changePassword);

// POST /api/auth/resend-otp — resend OTP to unverified account (reuses signup logic)
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const User = require('../models/User');
    const { generateOTP, sendOTPEmail } = require('../services/emailService');
    const OTP_EXPIRY_MS = 10 * 60 * 1000;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ success: false, message: 'No account found with this email.' });
    if (user.isVerified) return res.status(400).json({ success: false, message: 'This account is already verified. Please login.' });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
    // Reset OTP lockout so fresh 5-attempt window starts
    user.otpAttempts = 0;
    user.otpLockUntil = null;
    await user.save({ validateBeforeSave: false });
    await sendOTPEmail(user.email, otp);

    res.status(200).json({ success: true, message: 'OTP resent successfully. Check your email.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

