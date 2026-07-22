require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const ADMIN_EMAIL    = 'admin@prastav.com';
const ADMIN_PASSWORD = 'Prastav@Admin2026!';   // meets: upper, lower, digit, special char

const seedAdmin = async () => {
  try {
    await connectDB();

    // ── Check if ANY admin account already exists ─────────────────────────────
    const existingAdmin = await User.findOne({ role: 'admin' });

    if (existingAdmin) {
      console.log('\n✅ Admin account already exists in the database.');
      console.log('──────────────────────────────────────────');
      console.log(`  Email  : ${existingAdmin.email}`);
      console.log(`  Name   : ${existingAdmin.name}`);
      console.log(`  Role   : ${existingAdmin.role}`);
      console.log(`  Status : ${existingAdmin.status}`);
      console.log('──────────────────────────────────────────\n');
      console.log('ℹ️  Password is not displayed for security. Use the credentials you set when creating the account.');
      console.log('   If this is the default seeded admin, the password is: Prastav@Admin2026!');
      process.exit(0);
    }

    // ── No admin found — create one ───────────────────────────────────────────
    // We pass the plain-text password; the pre-save hook in User.js will hash it automatically.
    const admin = new User({
      name:           'Super Admin',
      email:          ADMIN_EMAIL,
      password:       ADMIN_PASSWORD,
      role:           'admin',
      isVerified:     true,         // skip OTP verification for admin
      status:         'active',
      preferencesSet: true,         // admin doesn't go through the onboarding step
    });

    await admin.save();

    console.log('\n🎉 Default admin account created successfully!');
    console.log('══════════════════════════════════════════════');
    console.log('  📧  Email    : admin@prastav.com');
    console.log('  🔐  Password : Prastav@Admin2026!');
    console.log('  👤  Role     : admin');
    console.log('  ✅  Status   : active / verified');
    console.log('══════════════════════════════════════════════');
    console.log('\n⚠️  IMPORTANT: Change this password after your first login!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding admin:', error.message);
    if (error.errors) {
      Object.values(error.errors).forEach(e => console.error('  •', e.message));
    }
    process.exit(1);
  }
};

seedAdmin();
