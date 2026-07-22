require('dotenv').config();
const http = require('http');

function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 Testing Admin Account & Routes\n');
  console.log('='.repeat(50));

  // Test 1: Health check
  const health = await makeRequest({ host: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
  console.log(`\n✅ Health Check: ${health.status === 200 ? 'PASS' : 'FAIL'} (HTTP ${health.status})`);

  // Test 2: Admin Login
  const loginReq = await makeRequest(
    { host: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' } },
    { email: 'admin@prastav.com', password: 'Prastav@Admin2026!' }
  );
  
  const loginOk = loginReq.status === 200 && loginReq.body.token;
  console.log(`\n${loginOk ? '✅' : '❌'} Admin Login: ${loginOk ? 'PASS' : 'FAIL'} (HTTP ${loginReq.status})`);
  if (!loginOk) { console.log('  Error:', loginReq.body.message); process.exit(1); }
  
  const token = loginReq.body.token;
  const user = loginReq.body.user;
  console.log(`   User:  ${user.name} (${user.email})`);
  console.log(`   Role:  ${user.role}`);
  console.log(`   Prefs: ${user.preferencesSet}`);
  console.log(`   Token: ${token.substring(0, 30)}...`);

  const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Test 3: Admin Stats
  const stats = await makeRequest({ host: 'localhost', port: 5000, path: '/api/admin/stats', method: 'GET', headers: authHeaders });
  console.log(`\n${stats.status === 200 ? '✅' : '❌'} GET /api/admin/stats: ${stats.status === 200 ? 'PASS' : 'FAIL'} (HTTP ${stats.status})`);
  if (stats.status === 200) {
    const d = stats.body.data;
    console.log(`   Users: ${d.users.total} total, ${d.users.active} active, ${d.users.suspended} suspended`);
    console.log(`   Books: ${d.books.total} total, ${d.books.reported} reported`);
    console.log(`   Txns:  ${d.transactions.total} total, ${d.transactions.completed} completed`);
  }

  // Test 4: Admin Users
  const users = await makeRequest({ host: 'localhost', port: 5000, path: '/api/admin/users?limit=5', method: 'GET', headers: authHeaders });
  console.log(`\n${users.status === 200 ? '✅' : '❌'} GET /api/admin/users: ${users.status === 200 ? 'PASS' : 'FAIL'} (HTTP ${users.status})`);
  if (users.status === 200) console.log(`   Total users: ${users.body.total}`);

  // Test 5: Admin Books
  const books = await makeRequest({ host: 'localhost', port: 5000, path: '/api/admin/books', method: 'GET', headers: authHeaders });
  console.log(`\n${books.status === 200 ? '✅' : '❌'} GET /api/admin/books: ${books.status === 200 ? 'PASS' : 'FAIL'} (HTTP ${books.status})`);
  if (books.status === 200) console.log(`   Total books: ${books.body.total}`);

  // Test 6: Admin Transactions
  const txns = await makeRequest({ host: 'localhost', port: 5000, path: '/api/admin/transactions', method: 'GET', headers: authHeaders });
  console.log(`\n${txns.status === 200 ? '✅' : '❌'} GET /api/admin/transactions: ${txns.status === 200 ? 'PASS' : 'FAIL'} (HTTP ${txns.status})`);
  if (txns.status === 200) console.log(`   Total transactions: ${txns.body.total}`);

  // Test 7: Audit Logs
  const logs = await makeRequest({ host: 'localhost', port: 5000, path: '/api/admin/logs', method: 'GET', headers: authHeaders });
  console.log(`\n${logs.status === 200 ? '✅' : '❌'} GET /api/admin/logs: ${logs.status === 200 ? 'PASS' : 'FAIL'} (HTTP ${logs.status})`);
  if (logs.status === 200) console.log(`   Total logs: ${logs.body.total}`);

  // Test 8: Ensure non-admin is blocked
  const noAuth = await makeRequest({ host: 'localhost', port: 5000, path: '/api/admin/stats', method: 'GET' });
  console.log(`\n${noAuth.status === 401 ? '✅' : '❌'} Unauthorized access blocked: ${noAuth.status === 401 ? 'PASS' : 'FAIL'} (HTTP ${noAuth.status})`);

  console.log('\n' + '='.repeat(50));
  console.log('🎉 All admin route tests completed!\n');
}

runTests().catch(err => { console.error('Test error:', err.message); process.exit(1); });
