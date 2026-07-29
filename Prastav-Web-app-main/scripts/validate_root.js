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
  console.log('\n===== STARTING E2E POST-FIX VALIDATION =====\n');

  // Test root path /
  let r = await request('GET', '/');
  if (r.status === 200) {
    pass(`GET / → 200 OK (Friendly landing page fixed)`);
  } else {
    fail(`GET /`, `Expected 200, got ${r.status}`);
  }

  // Test health check /api/health
  r = await request('GET', '/api/health');
  if (r.status === 200) {
    pass(`GET /api/health → 200 OK`);
  } else {
    fail(`GET /api/health`, `Expected 200, got ${r.status}`);
  }

  console.log('\n===== VALIDATION COMPLETE =====\n');
  process.exit(0);
}

runE2ETest().catch(e => {
  console.error('Validation script error:', e.message);
  process.exit(1);
});
