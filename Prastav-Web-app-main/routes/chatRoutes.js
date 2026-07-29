const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/authMiddleware');

/**
 * Helper: verify user is part of a transaction (conversation)
 */
async function getAuthorizedTransaction(transactionId, userId) {
  const transaction = await Transaction.findById(transactionId)
    .populate('book', 'title author imageUrl price condition')
    .populate('requester', 'name email profileImage')
    .populate('lister', 'name email profileImage reputationScore district');

  if (!transaction) return null;

  const isParticipant =
    transaction.requester._id.toString() === userId.toString() ||
    transaction.lister._id.toString() === userId.toString();

  return isParticipant ? transaction : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/chat/conversations — list all conversations (accepted transactions) for the user
// ─────────────────────────────────────────────────────────────────────────────
router.get('/conversations', protect, async (req, res) => {
  try {
    const chatStatuses = ['accepted', 'payment_pending', 'payment_uploaded', 'payment_completed', 'completed'];
    const transactions = await Transaction.find({
      $or: [{ requester: req.user._id }, { lister: req.user._id }],
      status: { $in: chatStatuses },
    })
      .populate('book', 'title author imageUrl price condition')
      .populate('requester', 'name email profileImage')
      .populate('lister', 'name email profileImage')
      .sort({ updatedAt: -1 });

    const conversations = transactions.map((tx) => {
      const isRequester = tx.requester._id.toString() === req.user._id.toString();
      const participant = isRequester ? tx.lister : tx.requester;
      return {
        _id: tx._id,
        participant: {
          _id: participant._id,
          name: participant.name,
          profileImage: participant.profileImage,
        },
        book: tx.book,
        status: tx.status,
        updatedAt: tx.updatedAt,
      };
    });

    res.status(200).json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/chat/conversations/:conversationId/messages — fetch messages
// ─────────────────────────────────────────────────────────────────────────────
router.get('/conversations/:conversationId/messages', protect, async (req, res) => {
  try {
    const transaction = await getAuthorizedTransaction(req.params.conversationId, req.user._id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Conversation not found or access denied.' });
    }

    const allowedStatuses = ['accepted', 'payment_pending', 'payment_uploaded', 'payment_completed', 'completed'];
    if (!allowedStatuses.includes(transaction.status)) {
      return res.status(403).json({ success: false, message: 'Chat is only available after the request is accepted.' });
    }

    const messages = await Message.find({ transaction: req.params.conversationId })
      .populate('sender', 'name profileImage')
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, count: messages.length, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/chat/conversations/:conversationId/messages — send a message
// ─────────────────────────────────────────────────────────────────────────────
router.post('/conversations/:conversationId/messages', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message text is required.' });
    }

    const transaction = await getAuthorizedTransaction(req.params.conversationId, req.user._id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Conversation not found or access denied.' });
    }

    const allowedStatuses = ['accepted', 'payment_pending', 'payment_uploaded', 'payment_completed', 'completed'];
    if (!allowedStatuses.includes(transaction.status)) {
      return res.status(403).json({ success: false, message: 'Chat is only available after the request is accepted.' });
    }

    const message = await Message.create({
      transaction: req.params.conversationId,
      sender: req.user._id,
      content: text.trim(),
    });

    await message.populate('sender', 'name profileImage');

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY: GET /api/chat/:transactionId — kept for backward compat
// ─────────────────────────────────────────────────────────────────────────────
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

    const messages = await Message.find({ transaction: req.params.transactionId })
      .populate('sender', 'name profileImage')
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, count: messages.length, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;