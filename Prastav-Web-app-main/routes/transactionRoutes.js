const express = require('express');
const router = express.Router();
const {
  createTransaction, respondToTransaction,
  getPaymentQR, uploadPaymentProof, verifyPayment,
  completeTransaction, cancelTransaction, rateTransaction,
  getMyTransactions, getSellerTransactions, getTransaction,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');
const { uploadPaymentProof: uploadProofMiddleware, handleMulterError } = require('../middleware/uploadMiddleware');
 
// ── General ──────────────────────────────────────────────────────────────────
router.get('/my',                    protect, getMyTransactions);
router.get('/seller',                protect, getSellerTransactions);
router.post('/request',              protect, createTransaction);
router.get('/:id',                   protect, getTransaction);
router.get('/:id/details',           protect, getTransaction);
router.put('/:id/accept',            protect, (req, res, next) => { req.body = req.body || {}; req.body.action = 'accepted'; respondToTransaction(req, res, next); });
router.put('/:id/reject',            protect, (req, res, next) => { req.body = req.body || {}; req.body.action = 'rejected'; respondToTransaction(req, res, next); });
router.put('/:id/cancel',            protect, cancelTransaction);
router.put('/:id/complete',          protect, completeTransaction);
router.post('/:id/rate',             protect, rateTransaction);
 
// ── Manual Payments ──────────────────────────────────────────────────────────
router.get('/:id/paymentQR',         protect, getPaymentQR);
router.put('/:id/paymentProof',      protect, uploadProofMiddleware.single('paymentProof'), handleMulterError, uploadPaymentProof);
router.put('/:id/verifyPayment',     protect, verifyPayment);
 
module.exports = router; 