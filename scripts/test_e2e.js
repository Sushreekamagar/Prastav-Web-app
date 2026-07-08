/**
 * Full E2E flow test: signup → verifyOtp (from DB) → login → profile
 * Tests the complete authentication cycle with real hashed passwords.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const http = require('http');
const mongoose = require('mongoose');
const User = require('../models/User');

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    };
    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch (e) { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function pass(label) { console.log(`✅ ${label}`); }
function fail(label, detail) { console.error(`❌ ${label}: ${detail}`); }

async function runE2ETest() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('\n===== FULL E2E AUTH FLOW TEST =====\n');

  const email = `e2e_${Date.now()}@example.com`;
  const password = 'SecurePass456!';

  // 1. SIGNUP
  let r = await request('POST', '/api/auth/signup', { name: 'E2E User', email, password, role: 'buyer' });
  if (r.status === 201 && r.body.userId) {
    pass(`signup → 201, userId: ${r.body.userId}`);
  } else {
    fail('signup', JSON.stringify(r.body));
    process.exit(1);
  }
  const userId = r.body.userId;

  // Fetch the OTP directly from DB (dev mode)
  const userWithOtp = await User.findById(userId).select('+otp +password');
  if (!userWithOtp) { fail('DB lookup', 'user not found after signup'); process.exit(1); }
  const otp = userWithOtp.otp;
  const pwIsHashed = userWithOtp.password && userWithOtp.password.startsWith('$2b');
  if (pwIsHashed) {
    pass(`password stored as bcrypt hash (not plain text): ${userWithOtp.password.substring(0, 20)}...`);
  } else {
    fail('password hashing', `password was stored as plain text: ${userWithOtp.password}`);
  }

  // 2. VERIFY OTP
  r = await request('POST', '/api/auth/verify-otp', { userId, otp });
  if (r.status === 200 && r.body.token) {
    pass(`verify-otp → 200, token received`);
  } else {
    fail('verify-otp', JSON.stringify(r.body));
    process.exit(1);
  }
  const tokenFromVerify = r.body.token;

  // 3. GET /api/profile with token from verify-otp
  r = await request('GET', '/api/profile', null, tokenFromVerify);
  if (r.status === 200 && r.body.user && r.body.user.email === email) {
    pass(`GET /api/profile after verify-otp → 200, email: ${r.body.user.email}`);
  } else {
    fail('GET /api/profile after verify-otp', JSON.stringify(r.body));
  }

  // 4. LOGIN with correct password
  r = await request('POST', '/api/auth/login', { email, password });
  if (r.status === 200 && r.body.token) {
    pass(`login → 200, token received`);
  } else {
    fail('login', JSON.stringify(r.body));
    process.exit(1);
  }
  const tokenFromLogin = r.body.token;

  // 5. GET /api/profile with token from login
  r = await request('GET', '/api/profile', null, tokenFromLogin);
  if (r.status === 200 && r.body.user && r.body.user.email === email) {
    pass(`GET /api/profile after login → 200`);
  } else {
    fail('GET /api/profile after login', JSON.stringify(r.body));
  }

  // 6. PUT /api/profile
  r = await request('PUT', '/api/profile', { name: 'E2E Updated', grade: '12' }, tokenFromLogin);
  if (r.status === 200 && r.body.user && r.body.user.name === 'E2E Updated') {
    pass(`PUT /api/profile → 200, name updated to "${r.body.user.name}"`);
  } else {
    fail('PUT /api/profile', JSON.stringify(r.body));
  }

  // 7. PUT /api/profile/location
  r = await request('PUT', '/api/profile/location', { latitude: 27.7172, longitude: 85.3240 }, tokenFromLogin);
  if (r.status === 200) {
    pass(`PUT /api/profile/location → 200`);
  } else {
    fail('PUT /api/profile/location', JSON.stringify(r.body));
  }

  // 8. PUT /api/profile/esewa
  r = await request('PUT', '/api/profile/esewa', { esewaNumber: '9800098765' }, tokenFromLogin);
  if (r.status === 200) {
    pass(`PUT /api/profile/esewa → 200`);
  } else {
    fail('PUT /api/profile/esewa', JSON.stringify(r.body));
  }

  // 9. PUT /api/profile/khalti
  r = await request('PUT', '/api/profile/khalti', { khaltiNumber: '9811223344' }, tokenFromLogin);
  if (r.status === 200) {
    pass(`PUT /api/profile/khalti → 200`);
  } else {
    fail('PUT /api/profile/khalti', JSON.stringify(r.body));
  }

  // 10. Login with wrong password (must 401)
  r = await request('POST', '/api/auth/login', { email, password: 'wrongpassword' });
  if (r.status === 401) {
    pass(`login wrong password → 401 (correct rejection)`);
  } else {
    fail('login wrong password', `expected 401, got ${r.status}`);
  }

  // Cleanup
  await User.deleteOne({ _id: userId });
  await mongoose.disconnect();

  console.log('\n===== E2E TEST COMPLETE =====\n');
  process.exit(0);
}

runE2ETest().catch(e => {
  console.error('E2E test error:', e.message, e.stack);
  process.exit(1);
});
