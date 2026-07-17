require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const path       = require('path');
const rateLimit  = require('express-rate-limit');
 
const connectDB      = require('./config/db');
const socketHandler  = require('./socket/socketHandler');
 
const authRoutes        = require('./routes/authRoutes');
const profileRoutes     = require('./routes/profileRoutes');
const bookRoutes        = require('./routes/bookRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const chatRoutes        = require('./routes/chatRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes    = require('./routes/dashboardRoutes');
const adminRoutes        = require('./routes/adminRoutes');
 
// ── Connect Database ──────────────────────────────────────────────────────────
connectDB();
 
const app    = express();
const server = http.createServer(app);
 
// ── Socket.io setup ───────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: (process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:3000').split(',').map(o => o.trim()),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
socketHandler(io);
 
// ── Global Middleware ─────────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o.trim()))) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
 
// Serve book images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
 
// General rate limiter — 100 req / 15 min per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});
app.use('/api/', generalLimiter);
 
// Stricter limiter on auth endpoints — 10 req / 5 min per IP
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many auth attempts. Try again in 5 minutes.' },
});
app.use('/api/auth/login',           authLimiter);
app.use('/api/auth/signup',          authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password',  authLimiter);
 
// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api',              profileRoutes);
app.use('/api/books',        bookRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/chat',         chatRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard',     dashboardRoutes);
app.use('/api/admin',         adminRoutes);

// Root endpoint - serves a friendly API landing page
app.get('/', (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Prastav API - Server Online</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background: linear-gradient(135deg, #0f172a, #1e293b);
          color: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          text-align: center;
        }
        .container {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 3rem;
          border-radius: 1rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
          max-width: 480px;
          width: 90%;
        }
        h1 {
          color: #10b981;
          margin-bottom: 0.5rem;
          font-size: 2.2rem;
        }
        p {
          color: #94a3b8;
          font-size: 1.1rem;
          margin-bottom: 1.5rem;
        }
        .status-badge {
          background-color: rgba(16, 185, 129, 0.2);
          color: #34d399;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          display: inline-block;
          font-weight: 600;
          font-size: 0.875rem;
          margin-bottom: 2rem;
        }
        .endpoints {
          text-align: left;
          background: rgba(15, 23, 42, 0.4);
          padding: 1.5rem;
          border-radius: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .endpoints h3 {
          margin-top: 0;
          color: #e2e8f0;
          font-size: 1rem;
        }
        .endpoints ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .endpoints li {
          margin-bottom: 0.50rem;
          font-size: 0.9rem;
          color: #cbd5e1;
        }
        .endpoints code {
          background: #334155;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          color: #38bdf8;
          font-family: monospace;
          margin-right: 0.5rem;
        }
        .endpoints a {
          color: #38bdf8;
          text-decoration: none;
        }
        .endpoints a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 Prastav Server</h1>
        <p>The backend services are up and running.</p>
        <span class="status-badge">● API Status: Healthy</span>
        <div class="endpoints">
          <h3>Quick Links & Endpoints:</h3>
          <ul>
            <li><code>GET</code> <a href="/api/health">/api/health</a> (Health Check)</li>
            <li><code>GET</code> /api/profile (Protected Profile)</li>
            <li><code>GET</code> /api/books (Books API)</li>
            <li><code>GET</code> /api/recommendations (Recommendations)</li>
          </ul>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🚀 Prastav API is running',
    timestamp: new Date().toISOString(),
  });
});
 
// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});
// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Prastav server running on http://localhost:${PORT}`);
  console.log(`📋 API Health:  http://localhost:${PORT}/api/health`);
  console.log(`👤 Profile API: http://localhost:${PORT}/api/profile`);
  console.log(`📚 Books API:   http://localhost:${PORT}/api/books`);
  console.log(`🎯 Recommend:   http://localhost:${PORT}/api/recommendations\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error(`   Run this to free it: npx kill-port ${PORT}`);
    console.error(`   Or kill the process in Task Manager (node.exe)\n`);
    process.exit(1);
  } else {
    throw err;
  }
});