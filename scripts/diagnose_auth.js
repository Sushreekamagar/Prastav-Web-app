require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');
const { signToken, verifyToken } = require('../utils/jwt');
const User = require('../models/User');

async function runTests() {
  // 1. Test JWT generation/verification
  console.log('\n=== JWT Tests ===');
  try {
    const token = signToken('507f1f77bcf86cd799439011');
    console.log('signToken OK, token length:', token.length);
    const decoded = verifyToken(token);
    console.log('verifyToken OK, decoded.id:', decoded.id);
  } catch (e) {
    console.error('JWT ERROR:', e.message);
  }

  // 2. Test DB connection and bcrypt
  console.log('\n=== DB + bcrypt Tests ===');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  const user = await User.findOne({ isVerified: true }).select('+password');
  if (!user) {
    console.log('No verified user found in DB');
  } else {
    console.log('Verified user found:', user.email);
    console.log('Password is hashed (starts with $2b):', user.password.startsWith('$2b'));
    
    // Test comparePassword method
    try {
      // We can't test the actual password, but we can verify the method exists and works
      const fakeResult = await user.comparePassword('wrong_password_12345');
      console.log('comparePassword method works, wrong pass result:', fakeResult);
    } catch (e) {
      console.error('comparePassword ERROR:', e.message);
    }
  }

  // 3. Check what the authMiddleware sees
  console.log('\n=== Auth Middleware Simulation ===');
  if (user) {
    const token = signToken(user._id);
    const decoded = verifyToken(token);
    console.log('Token decoded id:', decoded.id);
    const foundUser = await User.findById(decoded.id);
    if (foundUser) {
      console.log('User found by decoded.id OK:', foundUser.email, 'isVerified:', foundUser.isVerified);
    } else {
      console.error('User NOT found by decoded.id - this would cause 401');
    }
  }

  process.exit(0);
}

runTests().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
