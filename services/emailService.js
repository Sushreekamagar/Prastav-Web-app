const nodemailer = require('nodemailer');
const AppError = require('../utils/AppError');

/**
 * Email Service — handles all outbound emails via Nodemailer.
 * Supports Gmail SMTP (smtp.gmail.com:587) with App Passwords.
 *
 * Gmail Setup:
 *   1. Google Account > Security > Enable 2-Step Verification
 *   2. Security > App Passwords > Select "Mail" > Generate
 *   3. Copy the 16-digit password into EMAIL_PASS in .env
 *   4. Set EMAIL_DEV_MODE=false to send real emails
 *
 * Dev mode: set EMAIL_DEV_MODE=true to skip sending and log OTP to terminal.
 */
const PLACEHOLDER_VALUES = [
  'your_gmail@gmail.com',
  'your_16_digit_app_password',
  'your_mailtrap_user',
  'your_mailtrap_pass',
  '',
];

const isPlaceholder = (value) =>
  !value || PLACEHOLDER_VALUES.includes(String(value).trim());

const isDevMode = () =>
  process.env.EMAIL_DEV_MODE === 'true' ||
  isPlaceholder(process.env.EMAIL_USER) ||
  isPlaceholder(process.env.EMAIL_PASS);

/**
 * Builds a Nodemailer transporter for Gmail SMTP (port 587, STARTTLS).
 */
const getTransporter = () => {
  const port = parseInt(process.env.EMAIL_PORT, 10) || 587;
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465, // true for port 465 (SSL), false for 587 (STARTTLS)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false, // avoids self-signed cert issues in dev
    },
  });
};

/**
 * generateOTP — Returns a random 6-digit OTP string.
 */
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/**
 * sendMail — Sends email via SMTP, or logs OTP to terminal in dev mode.
 */
const sendMail = async ({ to, subject, html, context, otp }) => {
  if (isDevMode()) {
    console.log('\n📧 [DEV MODE] Email not sent — OTP logged below');
    console.log(`   To      : ${to}`);
    console.log(`   Context : ${context}`);
    console.log(`   OTP     : ${otp}`);
    console.log('   Tip: Fill EMAIL_USER and EMAIL_PASS in .env and set EMAIL_DEV_MODE=false\n');
    return;
  }

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"Prastav" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to} — ${subject}`);
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    throw new AppError(
      `Failed to send email to ${to}. (${error.message})`,
      500
    );
  }
};

/**
 * sendOTPEmail — Sends account verification OTP after signup.
 */
const sendOTPEmail = async (email, otp, name) => {
  await sendMail({
    to: email,
    subject: 'Verify your Prastav Account',
    context: `Signup verification for ${name}`,
    otp,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:10px;">
        <h2 style="color:#2d6a4f;">Welcome to Prastav, ${name}!</h2>
        <p style="color:#333;">Your OTP for email verification:</p>
        <div style="background:#f0faf4;padding:20px;text-align:center;border-radius:8px;margin:20px 0;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#2d6a4f;">${otp}</span>
        </div>
        <p style="color:#555;">This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <p style="color:#aaa;font-size:11px;">If you did not register on Prastav, ignore this email.</p>
      </div>
    `,
  });
};

/**
 * sendPasswordResetEmail — Sends OTP for forgot-password flow.
 */
const sendPasswordResetEmail = async (email, otp, name) => {
  await sendMail({
    to: email,
    subject: 'Reset your Prastav Password',
    context: `Password reset for ${name}`,
    otp,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:10px;">
        <h2 style="color:#2d6a4f;">Password Reset Request</h2>
        <p style="color:#333;">Hi ${name}, use this OTP to reset your password:</p>
        <div style="background:#f0faf4;padding:20px;text-align:center;border-radius:8px;margin:20px 0;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#2d6a4f;">${otp}</span>
        </div>
        <p style="color:#555;">This OTP expires in <strong>10 minutes</strong>.</p>
        <p style="color:#aaa;font-size:11px;">If you did not request a password reset, ignore this email.</p>
      </div>
    `,
  });
};

/**
 * sendNotificationEmail — Generic notification template (used by other modules later).
 */
const sendNotificationEmail = async (email, subject, htmlMessage) => {
  if (isDevMode()) {
    console.log(`\n📧 [DEV MODE] Notification to ${email}: ${subject}\n`);
    return;
  }

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"Prastav" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:10px;">
          <h3 style="color:#2d6a4f;">Prastav Notification</h3>
          ${htmlMessage}
          <p style="color:#aaa;font-size:11px;margin-top:20px;">— The Prastav Team</p>
        </div>
      `,
    });
  } catch (error) {
    throw new AppError(
      `Failed to send notification email. (${error.message})`,
      500
    );
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendPasswordResetEmail,
  sendNotificationEmail,
};
