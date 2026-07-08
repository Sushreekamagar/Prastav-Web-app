const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const Notification = require('../models/Notification');
const Conversation = require('../models/Conversation');
const { getRecommendations } = require('../services/recommendationService');

// GET /api/dashboard/buyer
const getBuyerDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Recommended books (hybrid engine)
    const recommendations = await getRecommendations({
      latitude: req.user.location?.coordinates?.[1],
      longitude: req.user.location?.coordinates?.[0],
      buyerGrade: req.user.grade,
      limit: 5,
    });

    // 2. Nearby books count — uses buyer's saved location (5 km default)
    let nearbyBooksCount = 0;
    let recentNearbyBooks = [];
    const coords = req.user.location?.coordinates;
    if (coords && coords[0] !== 0 && coords[1] !== 0) {
      const nearbyFilter = {
        isAvailable: { $ne: false },
        isReported: { $ne: true },
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [coords[0], coords[1]] },
            $maxDistance: 5000, // 5 km
          },
        },
      };
      const [nearbyBooks, nbCount] = await Promise.all([
        Book.find(nearbyFilter).select('title author genre Grade imageUrl price').limit(5).lean(),
        Book.countDocuments(nearbyFilter),
      ]);
      nearbyBooksCount = nbCount;
      recentNearbyBooks = nearbyBooks;
    }

    // 3. Active Requests (pending)
    const activeRequests = await Transaction.countDocuments({
      requester: userId,
      status: 'pending',
    });

    // 4. Pending Payments (payment_pending, payment_uploaded)
    const pendingPayments = await Transaction.countDocuments({
      requester: userId,
      status: { $in: ['payment_pending', 'payment_uploaded'] },
    });

    // 5. Completed Transactions
    const completedTransactions = await Transaction.countDocuments({
      requester: userId,
      status: 'completed',
    });

    // 6. Recent 5 Transactions
    const recentTransactions = await Transaction.find({ requester: userId })
      .populate('book', 'title imageUrl price')
      .populate('lister', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // 7. Recent 5 Notifications
    const recentNotifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    // 8. Recent Chats (conversations where user is buyer)
    const recentChats = await Conversation.find({ buyer: userId })
      .populate('seller', 'name profileImage')
      .populate('transaction', 'status book')
      .sort({ lastMessageAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          recommendedBooksCount: recommendations.total || 0,
          nearbyBooksCount,
          activeRequests,
          pendingPayments,
          completedTransactions,
        },
        recentRecommendations: recommendations.recommendations || [],
        recentNearbyBooks,
        recentTransactions,
        recentNotifications,
        recentChats,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dashboard/seller
const getSellerDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Listed Books
    const listedBooks = await Book.countDocuments({ seller: userId });

    // 2. Pending Requests
    const pendingRequests = await Transaction.countDocuments({
      lister: userId,
      status: 'pending',
    });

    // 3. Active Transactions
    const activeTransactions = await Transaction.countDocuments({
      lister: userId,
      status: { $in: ['accepted', 'payment_pending', 'payment_uploaded', 'payment_completed'] },
    });

    // 4. Completed Sales
    const completedSales = await Transaction.countDocuments({
      lister: userId,
      status: 'completed',
    });

    // 5. Recent 5 Pending Requests
    const recentRequests = await Transaction.find({ lister: userId, status: 'pending' })
      .populate('book', 'title imageUrl price')
      .populate('requester', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // 6. Recent 5 Completed Sales
    const recentSales = await Transaction.find({ lister: userId, status: 'completed' })
      .populate('book', 'title imageUrl price')
      .populate('requester', 'name')
      .sort({ completedAt: -1 })
      .limit(5);

    // 7. Recent 5 Notifications
    const recentNotifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    // 8. Recent Chats (conversations where user is seller)
    const recentChats = await Conversation.find({ seller: userId })
      .populate('buyer', 'name profileImage')
      .populate('transaction', 'status book')
      .sort({ lastMessageAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          listedBooks,
          pendingRequests,
          activeTransactions,
          completedSales,
          reputationScore: req.user.reputationScore || 0,
        },
        recentRequests,
        recentSales,
        recentNotifications,
        recentChats,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getBuyerDashboard,
  getSellerDashboard,
};
