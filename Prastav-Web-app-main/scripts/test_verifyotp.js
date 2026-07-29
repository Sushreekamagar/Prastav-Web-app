require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function testVerifyOtpFlow() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('\n=== verifyOtp flow: does save() double-hash? ===\n');

  // Simulate what verifyOtp does: it loads user and calls user.save() without touching password
  const email = `verifytest_${Date.now()}@example.com`;

  // Step 1: Create user (password gets hashed by pre-save)
  const user = await User.create({
    name: 'Verify Test',
    email,
    password: 'OriginalPass789',
    otp: '654321',
    otpExpiry: new Date(Date.now() + 600000),
  });

  // Step 2: Load user like verifyOtp does
  const loadedUser = await User.findById(user._id).select('+otp +otpExpiry');
  
  // Step 3: Simulate verifyOtp actions (does NOT touch password)
  loadedUser.isVerified = true;
  loadedUser.otp = undefined;
  loadedUser.otpExpiry = undefined;
  await loadedUser.save(); // This is the critical call

  // Step 4: Verify password still works after this save()
  const afterVerify = await User.findById(user._id).select('+password');
  const stillWorks = await afterVerify.comparePassword('OriginalPass789');
  console.log(`✅ Password still valid after verifyOtp save(): ${stillWorks}`);
  
  if (!stillWorks) {
    console.error('❌ DOUBLE-HASH BUG DETECTED: password was re-hashed during verifyOtp!');
  }

  // Cleanup
  await User.deleteOne({ _id: user._id });
  await mongoose.disconnect();
  process.exit(stillWorks ? 0 : 1);
}

testVerifyOtpFlow().catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
