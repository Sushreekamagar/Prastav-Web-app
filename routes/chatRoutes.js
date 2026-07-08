const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/authMiddleware');
 
// GET /api/chat/:transactionId — fetch all messages for a transaction
router.get('/:transactionId', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });

    if (
      transaction.requester.toString() !== req.user._id.toString() &&
      transaction.lister.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized for this chat.' });
    }

    const allowedStatuses = ['accepted', 'payment_pending', 'payment_uploaded', 'payment_completed', 'completed'];
    if (!allowedStatuses.includes(transaction.status)) {
      return res.status(403).json({ success: false, message: 'Chat is only available after request is accepted.' });
    }

    const messages = await Message.find({
      transaction: req.params.transactionId,
    })
      .populate('sender', 'name profileImage')
      .sort({ createdAt: 1 }); // oldest first
 
    res.status(200).json({ success: true, count: messages.length, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
 
module.exports = router;
 