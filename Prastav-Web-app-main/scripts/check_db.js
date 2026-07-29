require('dotenv').config();
const User = require('../models/User');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('DB connected');
  const all = await User.find({}).select('+password +otp +otpExpiry').limit(5);
  if (all.length === 0) {
    console.log('No users in DB — fresh database');
  } else {
    all.forEach(u => {
      const pwIsHashed = u.password && u.password.startsWith('$2');
      console.log(`User: ${u.email} | isVerified: ${u.isVerified} | passwordHashed: ${pwIsHashed} | role: ${u.role}`);
    });
  }
  process.exit(0);
}).catch(e => {
  console.error('DB connection error:', e.message);
  process.exit(1);
});
