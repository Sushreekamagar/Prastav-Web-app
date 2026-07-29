require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const http = require('http');
const { signToken } = require('../utils/jwt');
const User = require('../models/User');
const mongoose = require('mongoose');

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

function check(label, status, expected, body) {
  const ok = status === expected;
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} [${label}] Status: ${status} (expected: ${expected})`);
  if (!ok) console.log(`   Body: ${JSON.stringify(body).substring(0, 200)}`);
  else console.log(`   Body preview: ${JSON.stringify(body).substring(0, 120)}`);
  console.log();
}

async function runTests() {
  console.log('\n========== PRASTAV API ENDPOINT TESTS ==========\n');

  // Connect DB to get a real user token
  await mongoose.connect(process.env.MONGO_URI);
  const verifiedUser = await User.findOne({ isVerified: true });
  await mongoose.disconnect();

  let realToken = null;
  if (verifiedUser) {
    realToken = signToken(verifiedUser._id);
    console.log(`🔑 Using verified user: ${verifiedUser.email}`);
    console.log(`🔑 JWT: ${realToken.substring(0, 60)}...\n`);
  } else {
    console.log('⚠️  No verified user in DB — protected route tests will be skipped\n');
  }

  let r;

  // 1. Health
  r = await request('GET', '/api/health');
  check('GET /api/health', r.status, 200, r.body);

  // 2. Signup
  const testEmail = `apitest_${Date.now()}@example.com`;
  r = await request('POST', '/api/auth/signup', { name: 'Test User', email: testEmail, password: 'Test@1234', role: 'buyer' });
  check('POST /api/auth/signup', r.status, 201, r.body);
  const newUserId = r.body.userId;

  // 3. Verify OTP — invalid OTP but valid userId, route must respond 400
  if (newUserId) {
    r = await request('POST', '/api/auth/verify-otp', { userId: newUserId, otp: '000000' });
    check('POST /api/auth/verify-otp (invalid OTP → 400)', r.status, 400, r.body);
  }

  // 4. Login wrong password
  r = await request('POST', '/api/auth/login', { email: verifiedUser ? verifiedUser.email : 'test@test.com', password: 'wrongpassword' });
  check('POST /api/auth/login (wrong pass → 401)', r.status, 401, r.body);

  // 5. GET /api/profile — no token (must 401)
  r = await request('GET', '/api/profile');
  check('GET /api/profile (no token → 401)', r.status, 401, r.body);

  // 6. GET /api/profile — bad token (must 401)
  r = await request('GET', '/api/profile', null, 'invalid.token.here');
  check('GET /api/profile (bad token → 401)', r.status, 401, r.body);

  if (realToken) {
    // 7. GET /api/profile — valid token (must 200)
    r = await request('GET', '/api/profile', null, realToken);
    check('GET /api/profile (valid token → 200)', r.status, 200, r.body);

    // 8. PUT /api/profile
    r = await request('PUT', '/api/profile', { name: 'Hikmat Updated', grade: '11' }, realToken);
    check('PUT /api/profile → 200', r.status, 200, r.body);

    // 9. PUT /api/profile/location
    r = await request('PUT', '/api/profile/location', { latitude: 27.7172, longitude: 85.3240 }, realToken);
    check('PUT /api/profile/location → 200', r.status, 200, r.body);

    // 10. PUT /api/profile/esewa
    r = await request('PUT', '/api/profile/esewa', { esewaNumber: '9800012345' }, realToken);
    check('PUT /api/profile/esewa → 200', r.status, 200, r.body);

    // 11. PUT /api/profile/khalti
    r = await request('PUT', '/api/profile/khalti', { khaltiNumber: '9811112222' }, realToken);
    check('PUT /api/profile/khalti → 200', r.status, 200, r.body);

    // 12 & 13: esewaQR and khaltiQR require multipart/file upload — skip in unit test
    console.log('ℹ️  PUT /api/profile/esewaQR  — requires file upload, skipped in this test');
    console.log('ℹ️  PUT /api/profile/khaltiQR — requires file upload, skipped in this test');
    console.log('ℹ️  PUT /api/profile/image    — requires file upload, skipped in this test\n');
  }

  console.log('========== TESTS COMPLETE ==========\n');
  process.exit(0);
}

runTests().catch(e => {
  console.error('Test runner error:', e.message, e.stack);
  process.exit(1);
});
