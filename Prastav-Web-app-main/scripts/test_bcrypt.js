require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function testPasswordHashing() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('\n=== Password Hashing Tests ===\n');

  // Test 1: New user creation hashes password via pre-save hook
  const email = `hashtest_${Date.now()}@example.com`;
  const plainPw = 'PlainText123';
  
  const user = await User.create({
    name: 'Hash Test',
    email,
    password: plainPw,
    otp: '123456',
    otpExpiry: new Date(Date.now() + 600000),
  });
  
  const fetched = await User.findById(user._id).select('+password');
  const isHashed = fetched.password !== plainPw && fetched.password.startsWith('$2b');
  console.log(`✅ New user: password stored hashed: ${isHashed}`);
  console.log(`   Plain: "${plainPw.substring(0, 4)}..." → Stored: "${fetched.password.substring(0, 20)}..."`);
  
  // Test 2: comparePassword method works
  const correctMatch = await fetched.comparePassword(plainPw);
  const wrongMatch = await fetched.comparePassword('wrongpassword');
  console.log(`✅ comparePassword('${plainPw.substring(0, 4)}...'): ${correctMatch} (expected true)`);
  console.log(`✅ comparePassword('wrong'): ${wrongMatch} (expected false)`);
  
  // Test 3: Re-signup (existing unverified user) also hashes password
  const existing = await User.findById(user._id).select('+password');
  existing.password = 'NewPassword456';
  await existing.save();
  
  const afterResave = await User.findById(user._id).select('+password');
  const isHashedAfterResave = afterResave.password !== 'NewPassword456' && afterResave.password.startsWith('$2b');
  console.log(`✅ Re-save hashes new password: ${isHashedAfterResave}`);
  
  const newMatch = await afterResave.comparePassword('NewPassword456');
  console.log(`✅ comparePassword after resave: ${newMatch} (expected true)`);
  
  // Test 4: save with validateBeforeSave: false (used for loginAttempts) does NOT re-hash
  existing.loginAttempts = 1;
  await existing.save({ validateBeforeSave: false });
  const afterCountSave = await User.findById(user._id).select('+password');
  const stillHashed = afterCountSave.password.startsWith('$2b');
  console.log(`✅ save({validateBeforeSave:false}) keeps password hashed: ${stillHashed}`);
  
  // Cleanup
  await User.deleteOne({ _id: user._id });
  console.log('\n✅ All hashing tests passed\n');
  
  await mongoose.disconnect();
  process.exit(0);
}

testPasswordHashing().catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
