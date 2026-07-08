const mongoose = require('mongoose');
 
const transactionSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lister: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestType: {
      type: String,
      enum: ['Delivery', 'Exchange', 'Donation'],
      required: true,
    },
 
    // pending → accepted → payment_pending → payment_uploaded → payment_completed → completed
    // pending → rejected (lister rejects)
    // pending → cancelled (requester cancels)
    status: {
      type: String,
      enum: [
        'pending',            // requester sent request, waiting for lister
        'accepted',           // lister accepted — payment required if price > 0
        'payment_pending',    // waiting for buyer to upload payment proof
        'payment_uploaded',   // buyer uploaded proof, waiting for seller to verify
        'payment_completed',  // payment verified — ready for physical exchange
        'completed',          // physical exchange done, both can rate
        'rejected',           // lister rejected request
        'cancelled',          // requester cancelled
      ],
      default: 'pending',
    },
 
    meetingLandmark: {
      type: String,
      default: null,
    },
 
    // ── Payment ──────────────────────────────────────────────────────
    paymentMethod: {
      type: String,
      enum: ['free', 'esewa', 'khalti'],
      default: 'free',
    },
    paymentStatus: {
      type: String,
      enum: ['not_required', 'pending', 'completed', 'failed'],
      default: 'not_required',
    },
    paymentAmount: {
      type: Number,
      default: 0,
    },
    // Manual Payment Proof Upload
    paymentProof: {
      type: String,
      default: null,
    },
    paymentUploadedAt: {
      type: Date,
      default: null,
    },
    paymentVerifiedAt: {
      type: Date,
      default: null,
    },
 
    // ── Ratings (after completion) ────────────────────────────────────
    ratingByRequester: {
      score: { type: Number, min: 1, max: 5, default: null },
      comment: { type: String, maxlength: 300, default: '' },
      ratedAt: { type: Date, default: null },
    },
    ratingByLister: {
      score: { type: Number, min: 1, max: 5, default: null },
      comment: { type: String, maxlength: 300, default: '' },
      ratedAt: { type: Date, default: null },
    },
 
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);
 
transactionSchema.index({ requester: 1, status: 1, createdAt: -1 });
transactionSchema.index({ lister: 1, status: 1, createdAt: -1 });
transactionSchema.index({ book: 1 });
 
module.exports = mongoose.model('Transaction', transactionSchema);