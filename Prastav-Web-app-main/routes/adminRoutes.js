const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  getDashboardStats,
  getAllUsers,
  suspendUser,
  activateUser,
  resolveUserReport,
  getAllBooks,
  deleteBook,
  restoreBook,
  resolveBookReport,
  getAllTransactions,
  getAuditLogs
} = require('../controllers/adminController');

// All routes require authentication and admin role
router.use(protect);
router.use(restrictTo('admin'));

// Dashboard Stats
router.get('/stats', getDashboardStats);

// Users Management
router.get('/users', getAllUsers);
router.patch('/users/:id/suspend', suspendUser);
router.patch('/users/:id/activate', activateUser);
router.patch('/users/:id/resolve-report', resolveUserReport);

// Books Management
router.get('/books', getAllBooks);
router.delete('/books/:id', deleteBook); // Soft delete
router.patch('/books/:id/restore', restoreBook);
router.patch('/books/:id/resolve-report', resolveBookReport);

// Transactions Management
router.get('/transactions', getAllTransactions);

// Audit Logs
router.get('/logs', getAuditLogs);

module.exports = router;
