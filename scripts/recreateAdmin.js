require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const ADMIN_EMAIL = 'admin@prastav.com';
const ADMIN_PASSWORD = 'Prastav@Admin2026!';

const recreateAdmin = async () => {
  try {
    await connectDB();

    // 1. Delete all existing admins or users with admin email
    console.log('Cleaning up existing admin accounts...');
    const deleteRes = await User.deleteMany({
      $or: [
        { role: 'admin' },
        { email: ADMIN_EMAIL }
      ]
    });
    console.log(`Deleted ${deleteRes.deletedCount} existing admin account(s).`);

    // 2. Create the new admin account
    // The pre-save hook in User.js hashes the password automatically using bcrypt (10 rounds).
    const admin = new User({
      name: 'Super Admin',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
      isVerified: true,
      status: 'active',
      preferencesSet: true
    });

    await admin.save();

    console.log('\n🎉 Admin account recreated successfully!');
    console.log('══════════════════════════════════════════════');
    console.log(`  📧  Email    : ${ADMIN_EMAIL}`);
    console.log(`  🔐  Password : ${ADMIN_PASSWORD}`);
    console.log('  👤  Role     : admin');
    console.log('  ✅  Status   : active / verified');
    console.log('  🔄  Prefs    : Set (true)');
    console.log('══════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error recreating admin:', error.message);
    if (error.errors) {
      Object.values(error.errors).forEach(e => console.error('  •', e.message));
    }
    process.exit(1);
  }
};

recreateAdmin();
