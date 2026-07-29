const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All notification routes require authentication

router.get('/', getNotifications);
router.get('/unread', getUnreadNotifications);
router.put('/read-all', markAllAsRead); // Must be before /:id/read
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
