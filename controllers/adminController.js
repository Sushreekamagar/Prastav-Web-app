const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const User = require('../models/User');
const Book = require('../models/Book');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');

// Helper for Audit Logs
const logAction = async (adminId, action, targetId, targetModel, details = '') => {
  await AuditLog.create({ adminId, action, targetId, targetModel, details });
};

const getDashboardStats = asyncHandler(async (req, res, next) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalUsers, activeUsers, suspendedUsers, reportedUsers,
    usersToday, usersMonth,
    totalBooks, deletedBooks, reportedBooks,
    totalTransactions, completedTransactions, pendingTransactions,
    transactionsToday, transactionsMonth,
    totalSales
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: 'active' }),
    User.countDocuments({ status: 'suspended' }),
    User.countDocuments({ isReported: true }),
    User.countDocuments({ createdAt: { $gte: today } }),
    User.countDocuments({ createdAt: { $gte: startOfMonth } }),

    Book.countDocuments(),
    Book.countDocuments({ isDeleted: true }),
    Book.countDocuments({ isReported: true }),

    Transaction.countDocuments(),
    Transaction.countDocuments({ status: 'completed' }),
    Transaction.countDocuments({ status: 'pending' }),
    Transaction.countDocuments({ createdAt: { $gte: today } }),
    Transaction.countDocuments({ createdAt: { $gte: startOfMonth } }),

    // Total sales volume (assuming transaction has a price or we look at book price)
    // Actually just completed transactions count is fine for 'total completed sales'
    Transaction.countDocuments({ status: 'completed' })
  ]);

  res.status(200).json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers,
        reported: reportedUsers,
        joinedToday: usersToday,
        joinedThisMonth: usersMonth,
      },
      books: {
        total: totalBooks,
        deleted: deletedBooks,
        reported: reportedBooks,
      },
      transactions: {
        total: totalTransactions,
        completed: completedTransactions,
        pending: pendingTransactions,
        today: transactionsToday,
        thisMonth: transactionsMonth,
      }
    }
  });
});

const getAllUsers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }
  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.isReported === 'true') filter.isReported = true;

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    page,
    limit,
    total,
    count: users.length,
    users
  });
});

const suspendUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found', 404));
  if (user.role === 'admin') return next(new AppError('Cannot suspend another admin', 403));

  user.status = 'suspended';
  await user.save({ validateBeforeSave: false });

  await logAction(req.user._id, 'SUSPEND_USER', user._id, 'User', `Suspended user ${user.email}`);

  res.status(200).json({ success: true, message: 'User suspended successfully', user });
});

const activateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found', 404));

  user.status = 'active';
  await user.save({ validateBeforeSave: false });

  await logAction(req.user._id, 'ACTIVATE_USER', user._id, 'User', `Activated user ${user.email}`);

  res.status(200).json({ success: true, message: 'User activated successfully', user });
});

const resolveUserReport = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found', 404));

  user.isReported = false;
  await user.save({ validateBeforeSave: false });

  await logAction(req.user._id, 'REPORT_RESOLVED', user._id, 'User', `Resolved report for user ${user.email}`);

  res.status(200).json({ success: true, message: 'User report resolved', user });
});

const getAllBooks = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    filter.$or = [{ title: regex }, { author: regex }];
  }
  if (req.query.isReported === 'true') filter.isReported = true;
  if (req.query.isDeleted === 'true') filter.isDeleted = true;
  else if (req.query.isDeleted === 'false') filter.isDeleted = { $ne: true };

  const [books, total] = await Promise.all([
    Book.find(filter).populate('seller', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Book.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    page,
    limit,
    total,
    count: books.length,
    books
  });
});

const deleteBook = asyncHandler(async (req, res, next) => {
  const book = await Book.findById(req.params.id);
  if (!book) return next(new AppError('Book not found', 404));
  if (book.isDeleted) return next(new AppError('Book is already deleted', 400));

  book.isDeleted = true;
  book.isAvailable = false; // also mark as unavailable
  await book.save();

  await logAction(req.user._id, 'DELETE_BOOK', book._id, 'Book', `Soft deleted book ${book.title}`);

  res.status(200).json({ success: true, message: 'Book deleted successfully', book });
});

const restoreBook = asyncHandler(async (req, res, next) => {
  const book = await Book.findById(req.params.id);
  if (!book) return next(new AppError('Book not found', 404));

  book.isDeleted = false;
  book.isAvailable = true;
  await book.save();

  await logAction(req.user._id, 'RESTORE_BOOK', book._id, 'Book', `Restored book ${book.title}`);

  res.status(200).json({ success: true, message: 'Book restored successfully', book });
});

const resolveBookReport = asyncHandler(async (req, res, next) => {
  const book = await Book.findById(req.params.id);
  if (!book) return next(new AppError('Book not found', 404));

  book.isReported = false;
  await book.save();

  await logAction(req.user._id, 'REPORT_RESOLVED', book._id, 'Book', `Resolved report for book ${book.title}`);

  res.status(200).json({ success: true, message: 'Book report resolved', book });
});

const getAllTransactions = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.paymentMethod) filter.paymentMethod = req.query.paymentMethod;
  if (req.query.requestType) filter.requestType = req.query.requestType;

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate('book', 'title price')
      .populate('requester', 'name email')
      .populate('lister', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Transaction.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    page,
    limit,
    total,
    count: transactions.length,
    transactions
  });
});

const getAuditLogs = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find()
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments()
  ]);

  res.status(200).json({
    success: true,
    page,
    limit,
    total,
    count: logs.length,
    logs
  });
});

module.exports = {
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
};
