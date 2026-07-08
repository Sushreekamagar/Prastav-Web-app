const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendNotificationEmail } = require('../services/emailService');
 
// ────────────────────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────────────────────
// FULL MANUAL PAYMENT FLOW EXPLANATION
// ────────────────────────────────────────────────────────────────────────────
//
// 1. Buyer sends request       → POST /api/transactions/request
//    Status: "pending"
//
// 2. Seller accepts/rejects    → PUT /api/transactions/:id/accept
//    If accepted + book.price > 0 → Status: "payment_pending"
//    If accepted + book.price = 0 → Status: "payment_completed" (free exchange)
//
// 3. Buyer gets QR             → GET /api/transactions/:id/paymentQR
//    Returns seller's saved QR from profile.
//
// 4. Buyer uploads proof       → PUT /api/transactions/:id/paymentProof
//    Status: "payment_uploaded"
//
// 5. Seller verifies proof     → PUT /api/transactions/:id/verifyPayment
//    Status: "payment_completed"
//
// 6. Physical exchange happens → PUT /api/transactions/:id/complete
//    Status: "completed"
//
// 7. Both rate each other      → POST /api/transactions/:id/rate
//
// ────────────────────────────────────────────────────────────────────────────
 
// ────────────────────────────────────────────────────────────────────────────
// POST /api/transactions — Buyer requests a book
// ────────────────────────────────────────────────────────────────────────────
const createTransaction = async (req, res) => {
  try {
    const { bookId, meetingLandmark, requestType, paymentMethod = 'free' } = req.body;
 
    if (!bookId) {
      return res.status(400).json({ success: false, message: 'bookId is required.' });
    }
    if (!['Delivery', 'Exchange', 'Donation'].includes(requestType)) {
      return res.status(400).json({ success: false, message: 'Invalid requestType.' });
    }
 
    const book = await Book.findById(bookId).populate('seller');
    if (!book) return res.status(404).json({ success: false, message: 'Book not found.' });
    if (!book.isAvailable) return res.status(400).json({ success: false, message: 'This book is no longer available.' });
    if (book.seller._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot request your own book.' });
    }
 
    // Check if buyer already has a pending request for this book
    const existing = await Transaction.findOne({
      book: bookId,
      requester: req.user._id,
      status: { $in: ['pending', 'accepted', 'payment_pending'] },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have an active request for this book.' });
    }
 
    const transaction = await Transaction.create({
      book: bookId,
      requester: req.user._id,
      lister: book.seller._id,
      requestType,
      meetingLandmark: meetingLandmark || null,
      paymentMethod: book.price > 0 ? paymentMethod : 'free',
      paymentStatus: 'not_required',
      paymentAmount: book.price,
    });
 
    // Email notification to seller
    await sendNotificationEmail(
      book.seller.email,
      '📚 New Book Request — Prastav',
      `<p><strong>${req.user.name}</strong> has requested your book: <em>${book.title}</em>.</p>
       <p>Login to Prastav to accept or reject this request.</p>`
    );

    // In-app Notification to seller
    await Notification.create({
      recipient: book.seller._id,
      sender: req.user._id,
      title: 'New Book Request',
      message: `${req.user.name} has requested your book: ${book.title}.`,
      type: 'request_sent',
      relatedBook: book._id,
      relatedTransaction: transaction._id,
    });
 
    await transaction.populate([
      { path: 'book', select: 'title author price imageUrl' },
      { path: 'requester', select: 'name email' },
      { path: 'lister', select: 'name email' },
    ]);
 
    res.status(201).json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
 
// ────────────────────────────────────────────────────────────────────────────
// PUT /api/transactions/:id/respond — Seller accepts or rejects
// ────────────────────────────────────────────────────────────────────────────
const respondToTransaction = async (req, res) => {
  try {
    const { action } = req.body; // 'accepted' or 'rejected'
 
    if (!['accepted', 'rejected'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be "accepted" or "rejected".' });
    }
 
    const transaction = await Transaction.findById(req.params.id).populate([
      { path: 'book', select: 'title price' },
      { path: 'requester', select: 'name email' },
      { path: 'lister', select: 'name email' },
    ]);
 
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });
 
    const listerId = transaction.lister._id || transaction.lister;
    if (listerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the seller can respond to this request.' });
    }
    if (transaction.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot respond — current status is "${transaction.status}".` });
    }
 
    if (action === 'rejected') {
      transaction.status = 'rejected';
      await transaction.save();
 
      await sendNotificationEmail(
        transaction.requester.email,
        '❌ Book Request Rejected — Prastav',
        `<p>Unfortunately, your request for <em>${transaction.book.title}</em> was rejected by the seller.</p>
         <p>Keep exploring — there are more books near you on Prastav!</p>`
      );

      // In-app Notification to buyer
      await Notification.create({
        recipient: transaction.requester._id,
        sender: transaction.lister._id,
        title: 'Request Rejected',
        message: `Your request for ${transaction.book.title} was rejected.`,
        type: 'request_rejected',
        relatedBook: transaction.book._id,
        relatedTransaction: transaction._id,
      });
 
      return res.status(200).json({ success: true, transaction });
    }
 
    // ── Accepted ──────────────────────────────────────────────────────
    // If book is free → skip payment, go straight to payment_completed
    // If book has price → go to payment_pending (buyer must pay)
    if (transaction.paymentAmount > 0) {
      transaction.status = 'payment_pending';
      transaction.paymentStatus = 'pending';
    } else {
      transaction.status = 'payment_completed';
      transaction.paymentStatus = 'not_required';
    }
 
    await transaction.save();
 
    // Mark book as unavailable so others can't request it
    await Book.findByIdAndUpdate(transaction.book._id, { isAvailable: false });
 
    const paymentMsg =
      transaction.paymentAmount > 0
        ? `<p>Please complete the payment of <strong>NPR ${transaction.paymentAmount}</strong> on Prastav to proceed.</p>`
        : `<p>This is a free exchange. Please coordinate with the seller for the meetup.</p>`;
 
    await sendNotificationEmail(
      transaction.requester.email,
      '✅ Book Request Accepted — Prastav',
      `<p>Great news! <strong>${transaction.lister.name}</strong> has accepted your request for <em>${transaction.book.title}</em>.</p>
       ${paymentMsg}`
    );

    // In-app Notification to buyer
    await Notification.create({
      recipient: transaction.requester._id,
      sender: transaction.lister._id,
      title: 'Request Accepted',
      message: `${transaction.lister.name} has accepted your request for ${transaction.book.title}.`,
      type: 'request_accepted',
      relatedBook: transaction.book._id,
      relatedTransaction: transaction._id,
    });
 
    res.status(200).json({
      success: true,
      message: action === 'accepted' ? 'Request accepted.' : 'Request rejected.',
      transaction,
      // Tell frontend whether payment is needed
      requiresPayment: transaction.paymentAmount > 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
 
// ────────────────────────────────────────────────────────────────────────────
// GET /api/transactions/:id/paymentQR — Retrieve seller's QR
// ────────────────────────────────────────────────────────────────────────────
const getPaymentQR = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate('lister', 'esewaQR khaltiQR');

    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });

    const reqId = transaction.requester._id || transaction.requester;
    const lisId = transaction.lister._id || transaction.lister;
    const isParty =
      reqId.toString() === req.user._id.toString() ||
      lisId.toString() === req.user._id.toString();

    if (!isParty) return res.status(403).json({ success: false, message: 'Not authorized.' });

    if (transaction.status === 'pending' || transaction.status === 'rejected' || transaction.status === 'cancelled') {
       return res.status(400).json({ success: false, message: 'QR not available for this status.' });
    }

    if (transaction.paymentMethod === 'free') {
       return res.status(400).json({ success: false, message: 'This transaction is free.' });
    }

    const qrUrl = transaction.paymentMethod === 'esewa' ? transaction.lister.esewaQR : transaction.lister.khaltiQR;

    if (!qrUrl) {
      return res.status(404).json({ success: false, message: 'Seller has not uploaded the QR for this payment method.' });
    }

    res.status(200).json({ success: true, qrUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// PUT /api/transactions/:id/paymentProof — Buyer uploads proof
// ────────────────────────────────────────────────────────────────────────────
const uploadPaymentProof = async (req, res) => {
  try {
    // Bug fix: populate 'book' so notification message can reference book.title and book._id
    const transaction = await Transaction.findById(req.params.id)
      .populate('lister', 'name email')
      .populate('book', 'title');
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });

    const reqId = transaction.requester._id || transaction.requester;
    if (reqId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the buyer can upload payment proof.' });
    }

    if (transaction.status !== 'payment_pending') {
      return res.status(400).json({ success: false, message: 'Cannot upload proof at this stage.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Payment proof image is required.' });
    }

    transaction.paymentProof = `/uploads/payment-proof/${req.file.filename}`;
    transaction.status = 'payment_uploaded';
    transaction.paymentStatus = 'pending';
    transaction.paymentUploadedAt = new Date();
    await transaction.save();

    await sendNotificationEmail(
      transaction.lister.email,
      '🧾 Payment Proof Uploaded',
      `<p>Buyer has uploaded payment proof. Please review and verify it.</p>`
    );

    // In-app Notification to seller
    await Notification.create({
      recipient: transaction.lister._id,
      sender: transaction.requester._id,
      title: 'Payment Proof Uploaded',
      message: `Buyer has uploaded payment proof for ${transaction.book?.title || 'the book'}.`,
      type: 'payment_uploaded',
      relatedBook: transaction.book?._id,
      relatedTransaction: transaction._id,
    });

    res.status(200).json({ success: true, message: 'Payment proof uploaded successfully.', transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// PUT /api/transactions/:id/verifyPayment — Seller verifies proof
// ────────────────────────────────────────────────────────────────────────────
const verifyPayment = async (req, res) => {
  try {
    const { action } = req.body; // 'verified' or 'rejected'
    if (!['verified', 'rejected'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be verified or rejected.' });
    }

    const transaction = await Transaction.findById(req.params.id).populate('requester', 'name email');
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });

    const listerId = transaction.lister._id || transaction.lister;
    if (listerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the seller can verify the payment.' });
    }

    if (transaction.status !== 'payment_uploaded') {
      return res.status(400).json({ success: false, message: 'No payment proof to verify.' });
    }

    if (action === 'rejected') {
      transaction.status = 'payment_pending';
      transaction.paymentProof = null;
      await transaction.save();

      await sendNotificationEmail(
        transaction.requester.email,
        '❌ Payment Proof Rejected',
        `<p>Your payment proof was rejected. Please re-upload a valid proof.</p>`
      );

      // In-app Notification to buyer
      await Notification.create({
        recipient: transaction.requester._id,
        sender: transaction.lister._id,
        title: 'Payment Proof Rejected',
        message: `Your payment proof for ${transaction.book.title} was rejected.`,
        type: 'system',
        relatedBook: transaction.book._id,
        relatedTransaction: transaction._id,
      });
      return res.status(200).json({ success: true, message: 'Payment proof rejected.', transaction });
    }

    transaction.status = 'payment_completed';
    transaction.paymentStatus = 'completed';
    transaction.paymentVerifiedAt = new Date();
    await transaction.save();

    await sendNotificationEmail(
      transaction.requester.email,
      '✅ Payment Verified',
      `<p>Your payment has been verified. You can now complete the exchange.</p>`
    );

    // In-app Notification to buyer
    await Notification.create({
      recipient: transaction.requester._id,
      sender: transaction.lister._id,
      title: 'Payment Verified',
      message: `Your payment for ${transaction.book.title} has been verified.`,
      type: 'payment_verified',
      relatedBook: transaction.book._id,
      relatedTransaction: transaction._id,
    });

    res.status(200).json({ success: true, message: 'Payment verified successfully.', transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
 
// ────────────────────────────────────────────────────────────────────────────
// PUT /api/transactions/:id/complete — Mark physical exchange done
// ────────────────────────────────────────────────────────────────────────────
const completeTransaction = async (req, res) => {
  try {
    // Bug fix: populate 'book' so notification message can reference book.title and book._id
    const transaction = await Transaction.findById(req.params.id)
      .populate('book', 'title');
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });
 
    const reqId = transaction.requester._id || transaction.requester;
    const lisId = transaction.lister._id || transaction.lister;
    const isParty =
      reqId.toString() === req.user._id.toString() ||
      lisId.toString() === req.user._id.toString();
 
    if (!isParty) return res.status(403).json({ success: false, message: 'Not authorized.' });
 
    if (!['accepted', 'payment_completed'].includes(transaction.status)) {
      return res.status(400).json({
        success: false,
        message: 'Transaction must be accepted or payment completed before marking as done.',
      });
    }
 
    transaction.status = 'completed';
    transaction.completedAt = new Date();
    await transaction.save();
 
    // In-app Notification to both parties
    await Notification.create([
      {
        recipient: transaction.requester._id || transaction.requester,
        sender: transaction.lister._id || transaction.lister,
        title: 'Transaction Completed',
        message: `The exchange for ${transaction.book?.title || 'the book'} is now completed. You can rate the seller.`,
        type: 'transaction_completed',
        relatedBook: transaction.book?._id,
        relatedTransaction: transaction._id,
      },
      {
        recipient: transaction.lister._id || transaction.lister,
        sender: transaction.requester._id || transaction.requester,
        title: 'Transaction Completed',
        message: `The exchange for ${transaction.book?.title || 'the book'} is now completed. You can rate the buyer.`,
        type: 'transaction_completed',
        relatedBook: transaction.book?._id,
        relatedTransaction: transaction._id,
      }
    ]);
 
    res.status(200).json({
      success: true,
      message: 'Exchange completed! You can now rate each other.',
      transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
 
// ────────────────────────────────────────────────────────────────────────────
// PUT /api/transactions/:id/cancel — Buyer cancels a pending request
// ────────────────────────────────────────────────────────────────────────────
const cancelTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('book', 'title')
      .populate('lister', 'name email');
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });

    const reqId = transaction.requester._id || transaction.requester;
    if (reqId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the buyer can cancel this request.' });
    }

    if (!['pending'].includes(transaction.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel — current status is "${transaction.status}". Only pending requests can be cancelled.`,
      });
    }

    transaction.status = 'cancelled';
    await transaction.save();

    // Restore book availability
    await Book.findByIdAndUpdate(transaction.book?._id, { isAvailable: true });

    // Notify the seller
    await Notification.create({
      recipient: transaction.lister._id,
      sender: transaction.requester._id || transaction.requester,
      title: 'Request Cancelled',
      message: `${req.user.name} cancelled their request for ${transaction.book?.title || 'your book'}.`,
      type: 'request_cancelled',
      relatedBook: transaction.book?._id,
      relatedTransaction: transaction._id,
    });

    await sendNotificationEmail(
      transaction.lister.email,
      '❌ Book Request Cancelled — Prastav',
      `<p><strong>${req.user.name}</strong> has cancelled their request for <em>${transaction.book?.title || 'your book'}</em>.</p>`
    );

    res.status(200).json({ success: true, message: 'Request cancelled successfully.', transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
 
// ────────────────────────────────────────────────────────────────────────────
// POST /api/transactions/:id/rate — Rate the other party
// Updates reputation score immediately (within 1 min as per SRS F7)
// ────────────────────────────────────────────────────────────────────────────
const rateTransaction = async (req, res) => {
  try {
    const { score, comment } = req.body;
 
    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ success: false, message: 'Score must be between 1 and 5.' });
    }
 
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });
 
    if (transaction.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Transaction must be completed before rating.' });
    }
 
    const reqId = transaction.requester._id || transaction.requester;
    const lisId = transaction.lister._id || transaction.lister;
    const isRequester = reqId.toString() === req.user._id.toString();
    const isLister    = lisId.toString() === req.user._id.toString();
 
    if (!isRequester && !isLister) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
 
    if (isRequester) {
      if (transaction.ratingByRequester.score !== null) {
        return res.status(400).json({ success: false, message: 'You have already rated this transaction.' });
      }
      transaction.ratingByRequester = { score, comment: comment || '', ratedAt: new Date() };
      await updateReputation(transaction.lister, score);
    } else {
      if (transaction.ratingByLister.score !== null) {
        return res.status(400).json({ success: false, message: 'You have already rated this transaction.' });
      }
      transaction.ratingByLister = { score, comment: comment || '', ratedAt: new Date() };
      await updateReputation(transaction.requester, score);
    }
 
    await transaction.save();
 
    res.status(200).json({
      success: true,
      message: 'Rating submitted. Reputation score updated.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
 
// Helper: weighted average reputation update
const updateReputation = async (userId, newScore) => {
  const user = await User.findById(userId);
  if (!user) return;
  const total = user.reputationScore * user.totalRatings + newScore;
  user.totalRatings += 1;
  user.reputationScore = parseFloat((total / user.totalRatings).toFixed(2));
  await user.save();
};
 
// ────────────────────────────────────────────────────────────────────────────
// GET /api/transactions/my — All transactions for logged in user
// ────────────────────────────────────────────────────────────────────────────
const getMyTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ requester: req.user._id })
      .populate('book', 'title author imageUrl price condition')
      .populate('requester', 'name reputationScore')
      .populate('lister', 'name reputationScore')
      .sort({ createdAt: -1 });
 
    res.status(200).json({ success: true, count: transactions.length, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// GET /api/transactions/seller — All transactions for seller
// ────────────────────────────────────────────────────────────────────────────
const getSellerTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ lister: req.user._id })
      .populate('book', 'title author imageUrl price condition')
      .populate('requester', 'name reputationScore')
      .populate('lister', 'name reputationScore')
      .sort({ createdAt: -1 });
 
    res.status(200).json({ success: true, count: transactions.length, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
 
// ────────────────────────────────────────────────────────────────────────────
// GET /api/transactions/:id — Single transaction detail
// ────────────────────────────────────────────────────────────────────────────
const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('book', 'title author imageUrl price condition')
      .populate('requester', 'name reputationScore email')
      .populate('lister', 'name reputationScore email');
 
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });
 
    const reqId = transaction.requester._id || transaction.requester;
    const lisId = transaction.lister._id || transaction.lister;
    const isParty =
      reqId.toString() === req.user._id.toString() ||
      lisId.toString() === req.user._id.toString();
    if (!isParty) return res.status(403).json({ success: false, message: 'Not authorized.' });
 
    res.status(200).json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
 
module.exports = {
  createTransaction,
  respondToTransaction,
  getPaymentQR,
  uploadPaymentProof,
  verifyPayment,
  completeTransaction,
  cancelTransaction,
  rateTransaction,
  getMyTransactions,
  getSellerTransactions,
  getTransaction,
};