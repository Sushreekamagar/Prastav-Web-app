require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const fixAdmin = async () => {
  try {
    await connectDB();

    const result = await User.updateMany(
      { role: 'admin' },
      { $set: { preferencesSet: true, isVerified: true, status: 'active' } }
    );

    console.log(`\n✅ Fixed ${result.modifiedCount} admin account(s).`);
    console.log('   Set preferencesSet=true, isVerified=true, status=active\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

fixAdmin();
