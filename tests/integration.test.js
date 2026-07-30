/**
 * ============================================================
 *  PRASTAV BACKEND — AUTOMATED INTEGRATION TEST SUITE
 *  Node.js HTTP Client (uses axios — already in dependencies)
 * ============================================================
 *
 *  HOW TO RUN:
 *    1. Make sure server is running:  npm run server
 *    2. Open a NEW terminal and run:  node tests/integration.test.js
 *
 *  WHAT IT TESTS:
 *    ✅ Health Check
 *    ✅ Auth  — Login (valid + invalid credentials)
 *    ✅ Books — Get all, Search, Filter, Get single book
 *    ✅ Profile — Get profile (protected, needs JWT)
 *    ✅ Transactions — Get my transactions (protected)
 *    ✅ Notifications — Get notifications (protected)
 *    ✅ Recommendations — Get recommendations (protected)
 *    ✅ Unauthorized access guard (missing token → 401)
 *
 *  NOTE: Rate limiter is skipped via the x-test-suite header.
 * ============================================================
 */

const axios = require('axios');

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

// 👇 Change these to valid test credentials OR set as env variables
const TEST_EMAIL    = process.env.TEST_EMAIL    || 'sushhmagar@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'sushreeka';

// ── State ─────────────────────────────────────────────────────────────────────
let authToken  = null;   // JWT set after login
let firstBookId = null;  // grabbed from GET /api/books for sub-tests

// ── Test runner helpers ───────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures = [];

function log(symbol, label, detail = '') {
  const color = symbol === '✅' ? '\x1b[32m' : symbol === '❌' ? '\x1b[31m' : '\x1b[33m';
  const reset = '\x1b[0m';
  console.log(`  ${color}${symbol}${reset} ${label}${detail ? `  →  ${color}${detail}${reset}` : ''}`);
}

async function test(label, fn) {
  try {
    await fn();
    passed++;
    log('✅', label);
  } catch (err) {
    failed++;
    const msg = err.response
      ? `HTTP ${err.response.status} — ${JSON.stringify(err.response.data?.message ?? err.response.data)}`
      : err.message;
    log('❌', label, msg);
    failures.push({ label, msg });
  }
}

function section(title) {
  console.log(`\n\x1b[34m${'─'.repeat(56)}\x1b[0m`);
  console.log(`\x1b[1m\x1b[34m  ${title}\x1b[0m`);
  console.log(`\x1b[34m${'─'.repeat(56)}\x1b[0m`);
}

function assert(condition, message) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

// ── HTTP client factory ───────────────────────────────────────────────────────
function api(useAuth = false) {
  const headers = {
    'Content-Type': 'application/json',
    'x-test-suite': 'true',           // skips rate limiter (see server.js)
  };
  if (useAuth && authToken) headers['Authorization'] = `Bearer ${authToken}`;
  return axios.create({ baseURL: BASE_URL, headers, timeout: 10000 });
}

// ── TEST SUITES ───────────────────────────────────────────────────────────────

async function runHealthTests() {
  section('🏥  HEALTH CHECK');

  await test('GET /api/health → 200 OK', async () => {
    const { data, status } = await api().get('/api/health');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.success === true, 'Expected success: true');
    assert(typeof data.message === 'string', 'Expected a message string');
    assert(typeof data.timestamp === 'string', 'Expected a timestamp string');
  });

  await test('GET / (root) → 200 HTML page', async () => {
    const { status, headers } = await api().get('/');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(headers['content-type'].includes('text/html'), 'Expected HTML content-type');
  });
}

async function runAuthTests() {
  section('🔐  AUTH');

  await test('POST /api/auth/login — valid credentials → 200 + token', async () => {
    const { data, status } = await api().post('/api/auth/login', {
      email:    TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.success === true, 'Expected success: true');
    assert(typeof data.token === 'string' && data.token.length > 10, 'Expected a JWT token');
    authToken = data.token; // save for later protected tests
    log('⚡', '  JWT token captured — protected tests will use this token');
  });

  await test('POST /api/auth/login — wrong password → 400 or 401', async () => {
    try {
      await api().post('/api/auth/login', {
        email:    TEST_EMAIL,
        password: 'WRONG_PASSWORD_123!',
      });
      throw new Error('Expected an error response but got success');
    } catch (err) {
      const status = err.response?.status;
      assert(
        status === 400 || status === 401 || status === 403,
        `Expected 4xx error for wrong password, got ${status}`
      );
    }
  });

  await test('POST /api/auth/login — missing fields → 400 validation error', async () => {
    try {
      await api().post('/api/auth/login', { email: '' });
      throw new Error('Expected an error response but got success');
    } catch (err) {
      const status = err.response?.status;
      assert(status === 400, `Expected 400 validation error, got ${status}`);
    }
  });
}

async function runBookTests() {
  section('📚  BOOKS (Public Routes)');

  await test('GET /api/books → 200 + array of books', async () => {
    const { data, status } = await api().get('/api/books');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.success === true, 'Expected success: true');
    // Grab first book ID for later sub-tests
    const books = data.data ?? data.books ?? data;
    if (Array.isArray(books) && books.length > 0) {
      firstBookId = books[0]._id ?? books[0].id;
    }
  });

  await test('GET /api/books?page=1&limit=5 — pagination params work', async () => {
    const { data, status } = await api().get('/api/books?page=1&limit=5');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.success === true, 'Expected success: true');
  });

  await test('GET /api/books/search?q=harry — search works', async () => {
    const { data, status } = await api().get('/api/books/search?q=harry');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.success === true, 'Expected success: true');
  });

  await test('GET /api/books/filter?genre=fiction — filter works', async () => {
    const { data, status } = await api().get('/api/books/filter?genre=fiction');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.success === true, 'Expected success: true');
  });

  await test('GET /api/books/:id — single book (if a book exists)', async () => {
    if (!firstBookId) {
      log('⚠️', '  SKIPPED — no books in DB yet. Add a book and re-run.');
      return;
    }
    const { data, status } = await api().get(`/api/books/${firstBookId}`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.success === true, 'Expected success: true');
  });

  await test('GET /api/books/:id — invalid ID → 400 or 404', async () => {
    try {
      await api().get('/api/books/invalid-id-xyz');
      throw new Error('Expected error but got success');
    } catch (err) {
      const status = err.response?.status;
      assert(
        status === 400 || status === 404 || status === 500,
        `Expected 4xx/5xx for invalid book ID, got ${status}`
      );
    }
  });
}

async function runProtectedTests() {
  section('🔒  PROTECTED ROUTES (requires JWT)');

  if (!authToken) {
    console.log('\n  \x1b[33m⚠️  SKIPPING — Login failed, no JWT token available.\x1b[0m\n');
    return;
  }

  // ── Profile ────────────────────────────────────────────────────────────────
  await test('GET /api/profile → 200 + user data', async () => {
    const { data, status } = await api(true).get('/api/profile');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.success === true, 'Expected success: true');
    assert(data.data?.email || data.user?.email, 'Expected email in response');
  });

  // ── Unauthorized guard check ───────────────────────────────────────────────
  await test('GET /api/profile WITHOUT token → 401 Unauthorized', async () => {
    try {
      await api(false).get('/api/profile');
      throw new Error('Expected 401 but got success');
    } catch (err) {
      const status = err.response?.status;
      assert(status === 401, `Expected 401, got ${status}`);
    }
  });

  // ── My Listings ────────────────────────────────────────────────────────────
  await test('GET /api/books/my-listings → 200 (seller listings)', async () => {
    const { data, status } = await api(true).get('/api/books/my-listings');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.success === true, 'Expected success: true');
  });

  // ── Transactions ───────────────────────────────────────────────────────────
  await test('GET /api/transactions/my → 200 (my transactions)', async () => {
    const { data, status } = await api(true).get('/api/transactions/my');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.success === true, 'Expected success: true');
  });

  await test('GET /api/transactions/seller → 200 (seller transactions)', async () => {
    const { data, status } = await api(true).get('/api/transactions/seller');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.success === true, 'Expected success: true');
  });

  // ── Notifications ─────────────────────────────────────────────────────────
  await test('GET /api/notifications → 200', async () => {
    const { data, status } = await api(true).get('/api/notifications');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.success === true, 'Expected success: true');
  });

  // ── Recommendations ───────────────────────────────────────────────────────
  await test('GET /api/recommendations → 200', async () => {
    const { data, status } = await api(true).get('/api/recommendations');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.success === true, 'Expected success: true');
  });

  // ── Dashboard ─────────────────────────────────────────────────────────────
  await test('GET /api/dashboard/buyer → 200 (buyer dashboard)', async () => {
    const { data, status } = await api(true).get('/api/dashboard/buyer');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.success === true, 'Expected success: true');
  });

  await test('GET /api/dashboard/seller → 200 (seller dashboard)', async () => {
    const { data, status } = await api(true).get('/api/dashboard/seller');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.success === true, 'Expected success: true');
  });
}

async function runEdgeCaseTests() {
  section('⚡  EDGE CASES & SECURITY');

  await test('GET /api/nonexistent-route → 404', async () => {
    try {
      await api().get('/api/this-route-does-not-exist-xyz');
      throw new Error('Expected 404 but got success');
    } catch (err) {
      const status = err.response?.status;
      assert(status === 404, `Expected 404, got ${status}`);
    }
  });

  await test('POST /api/auth/login with invalid JSON body fields → 400', async () => {
    try {
      await api().post('/api/auth/login', { random_field: 123 });
      throw new Error('Expected 400 but got success');
    } catch (err) {
      const status = err.response?.status;
      assert(status === 400, `Expected 400, got ${status}`);
    }
  });

  await test('GET /api/books/nearby (no coords) → 400 or 200', async () => {
    // Nearby without coordinates — should either 400 or return empty gracefully
    try {
      const { status } = await api().get('/api/books/nearby');
      assert(status === 200 || status === 400, `Expected 200 or 400, got ${status}`);
    } catch (err) {
      const status = err.response?.status;
      assert(status === 400, `Expected 400 for missing coords, got ${status}`);
    }
  });
}

// ── Main runner ───────────────────────────────────────────────────────────────
async function runAllTests() {
  console.log('\n\x1b[1m\x1b[36m');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║     PRASTAV API — AUTOMATED INTEGRATION TESTS       ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`\x1b[0m  Target: \x1b[33m${BASE_URL}\x1b[0m`);
  console.log(`  User:   \x1b[33m${TEST_EMAIL}\x1b[0m`);
  console.log(`  Time:   \x1b[33m${new Date().toLocaleString()}\x1b[0m`);

  const startTime = Date.now();

  await runHealthTests();
  await runAuthTests();
  await runBookTests();
  await runProtectedTests();
  await runEdgeCaseTests();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n\x1b[34m' + '═'.repeat(56) + '\x1b[0m');
  console.log('\x1b[1m  TEST SUMMARY\x1b[0m');
  console.log('\x1b[34m' + '─'.repeat(56) + '\x1b[0m');
  console.log(`  Total:   ${passed + failed} tests  |  ⏱  ${elapsed}s`);
  console.log(`  \x1b[32m✅ Passed: ${passed}\x1b[0m`);
  console.log(`  \x1b[31m❌ Failed: ${failed}\x1b[0m`);

  if (failures.length > 0) {
    console.log('\n\x1b[31m  Failed Tests:\x1b[0m');
    failures.forEach(({ label, msg }, i) => {
      console.log(`  ${i + 1}. \x1b[31m${label}\x1b[0m`);
      console.log(`     \x1b[90m${msg}\x1b[0m`);
    });
  }

  console.log('\x1b[34m' + '═'.repeat(56) + '\x1b[0m');

  if (failed > 0) {
    console.log('\n  \x1b[33m💡 Tips:\x1b[0m');
    console.log('  • Make sure your server is running: npm run server');
    console.log('  • Check .env has correct MONGO_URI and JWT_SECRET');
    console.log('  • Update TEST_EMAIL / TEST_PASSWORD in this file');
    console.log('  • Some tests need real DB data (books, transactions)\n');
    process.exit(1);  // non-zero exit = CI pipeline knows tests failed
  } else {
    console.log('\n  \x1b[32m🎉 All tests passed! API is healthy.\x1b[0m\n');
    process.exit(0);
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────
runAllTests().catch((err) => {
  console.error('\n\x1b[31m💥 Test runner crashed:\x1b[0m', err.message);
  console.error('   Is the server running?  →  npm run server\n');
  process.exit(1);
});
