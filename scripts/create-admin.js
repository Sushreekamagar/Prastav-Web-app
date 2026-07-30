/**
 * ============================================================
 *  CREATE ADMIN SCRIPT
 *  Checks if admin@prastav.com exists in MongoDB.
 *  If NOT found → creates admin user automatically.
 *
 *  HOW TO RUN:
 *    node scripts/create-admin.js
 * ============================================================
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── Minimal User schema (same as models/User.js) ──────────────────────────────
const userSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  email:          { type: String, required: true, unique: true, lowercase: true },
  password:       { type: String, required: true, select: false },
  role:           { type: String, enum: ['buyer', 'seller', 'both', 'admin'], default: 'buyer' },
  status:         { type: String, enum: ['active', 'suspended'], default: 'active' },
  isVerified:     { type: Boolean, default: false },
  isReported:     { type: Boolean, default: false },
  profileImage:   { type: String, default: null },
  grade:          { type: String, default: null },
  district:       { type: String, default: null },
  reputationScore:{ type: Number, default: 3.0 },
  totalRatings:   { type: Number, default: 0 },
  esewaNumber:    { type: String, default: null },
  khaltiNumber:   { type: String, default: null },
  esewaQR:        { type: String, default: null },
  khaltiQR:       { type: String, default: null },
  preferencesSet: { type: Boolean, default: false },
  preferences:    { type: mongoose.Schema.Types.Mixed, default: null },
  sellerPreferences: { type: mongoose.Schema.Types.Mixed, default: null },
  location: {
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  loginAttempts: { type: Number, default: 0, select: false },
  lockUntil:     { type: Date, default: null, select: false },
  otpAttempts:   { type: Number, default: 0, select: false },
  otpLockUntil:  { type: Date, default: null, select: false },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// ── Admin credentials (change password here if you want) ─────────────────────
const ADMIN_EMAIL    = 'admin@prastav.com';
const ADMIN_PASSWORD = 'Admin@1234';   // strong password (uppercase + special char)
const ADMIN_NAME     = 'Prastav Admin';

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n\x1b[36m🔍 Connecting to MongoDB...\x1b[0m');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('\x1b[32m✅ Connected to:', process.env.MONGO_URI, '\x1b[0m\n');

  // ── Check if admin already exists ─────────────────────────────────────────
  const existing = await User.findOne({ email: ADMIN_EMAIL }).select('+password');

  if (existing) {
    console.log('\x1b[33m⚠️  Admin already EXISTS in database:\x1b[0m');
    console.log('─────────────────────────────────');
    console.log(`  📧 Email  : ${existing.email}`);
    console.log(`  👤 Name   : ${existing.name}`);
    console.log(`  🛡️  Role   : ${existing.role}`);
    console.log(`  ✅ Verified: ${existing.isVerified}`);
    console.log(`  🔵 Status : ${existing.status}`);
    console.log(`  🆔 _id    : ${existing._id}`);
    console.log('─────────────────────────────────');

    if (existing.role !== 'admin') {
      console.log('\n\x1b[31m❌ WARNING: This user exists but role is NOT "admin"!\x1b[0m');
      console.log('   Fixing role to "admin" now...');
      existing.role = 'admin';
      existing.isVerified = true;
      await existing.save({ validateBeforeSave: false });
      console.log('\x1b[32m✅ Role updated to "admin" successfully!\x1b[0m');
    } else {
      console.log('\x1b[32m✅ Admin account is properly configured. No action needed.\x1b[0m');
    }

    console.log('\n\x1b[36m📋 Login credentials for Postman:\x1b[0m');
    console.log(`  Email   : ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}  (if you just created it)`);
    console.log('  If password is different, reset it or check what you set originally.\n');

  } else {
    // ── Admin NOT found → create one ────────────────────────────────────────
    console.log('\x1b[31m❌ Admin NOT found in database. Creating now...\x1b[0m\n');

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const admin = await User.create({
      name:       ADMIN_NAME,
      email:      ADMIN_EMAIL,
      password:   hashedPassword,
      role:       'admin',
      isVerified: true,       // admin doesn't need OTP verification
      status:     'active',
    });

    console.log('\x1b[32m✅ Admin created successfully!\x1b[0m');
    console.log('─────────────────────────────────');
    console.log(`  🆔 _id    : ${admin._id}`);
    console.log(`  📧 Email  : ${admin.email}`);
    console.log(`  🔑 Password: ${ADMIN_PASSWORD}`);
    console.log(`  🛡️  Role   : ${admin.role}`);
    console.log(`  ✅ Verified: ${admin.isVerified}`);
    console.log('─────────────────────────────────');
    console.log('\n\x1b[36m📋 Use these in Postman:\x1b[0m');
    console.log(`  POST http://localhost:5000/api/auth/login`);
    console.log(`  Body: { "email": "${ADMIN_EMAIL}", "password": "${ADMIN_PASSWORD}" }\n`);
  }

  await mongoose.disconnect();
  console.log('\x1b[90m🔌 Disconnected from MongoDB.\x1b[0m\n');
  process.exit(0);
}

run().catch((err) => {
  console.error('\n\x1b[31m💥 Script failed:\x1b[0m', err.message);
  process.exit(1);
});
