const assert = require('assert');
const Transaction = require('../models/Transaction');
const transactionController = require('../controllers/transactionController');
const { Types } = require('mongoose');

// Mock request and response
const mockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.data = data;
    return res;
  };
  return res;
};

// Override Mongoose methods
let transactions = [];
Transaction.create = async (data) => {
  const t = { _id: new Types.ObjectId(), status: 'pending', ...data, save: async function() { 
    const idx = transactions.findIndex(tx => tx._id.toString() === this._id.toString());
    if (idx > -1) transactions[idx] = this;
    return this; 
  }, populate: async function() { return this; } };
  transactions.push(t);
  return t;
};

Transaction.findById = (id) => {
  const orig = transactions.find(t => t._id.toString() === id.toString());
  if (!orig) return { populate: async () => null };
  const t = { ...orig };
  t.save = orig.save;
  return {
    populate: async (fields) => {
      // Mock populate based on fields requested
      const fieldStr = Array.isArray(fields) ? fields.map(f => f.path).join(' ') : (fields && fields.path ? fields.path : fields);
      if (!fieldStr || typeof fieldStr !== 'string') return t;
      
      if (fieldStr.includes('book')) t.book = typeof t.book === 'string' ? { _id: t.book, title: 'Test Book', price: 500 } : t.book;
      if (fieldStr.includes('lister')) t.lister = typeof t.lister === 'string' ? { _id: t.lister, name: 'Seller', eduEmail: 'seller@test.com', esewaQR: t.lister === "seller123" && orig.lister.esewaQR ? orig.lister.esewaQR : undefined } : t.lister;
      if (fieldStr.includes('requester')) t.requester = typeof t.requester === 'string' ? { _id: t.requester, name: 'Buyer', eduEmail: 'buyer@test.com' } : t.requester;
      return t;
    },
    ...t
  };
};

Transaction.findOne = async (query) => {
  const { book, requester, status } = query;
  if (book && requester && status) {
    const statuses = status.$in || [status];
    return transactions.find(t => 
      t.book.toString() === book.toString() && 
      t.requester.toString() === requester.toString() && 
      statuses.includes(t.status)
    );
  }
  if (query.paymentTransactionId) {
    return transactions.find(t => t.paymentTransactionId === query.paymentTransactionId);
  }
  return null;
};

Transaction.find = async (query) => {
  let res = transactions.filter(t => t.requester === query.requester || t.lister === query.lister);
  return {
    populate: () => ({
      populate: () => ({
        populate: () => ({
          sort: async () => res
        })
      })
    })
  };
};

// Mock Book and User
const Book = require('../models/Book');
Book.findById = (id) => ({
  populate: async () => ({
    _id: id,
    title: "Test Book",
    price: 500,
    isAvailable: true,
    seller: { _id: "seller123", name: "Seller", eduEmail: "seller@test.com" }
  })
});
Book.findByIdAndUpdate = async () => {};

const User = require('../models/User');
User.findById = (id) => ({
  _id: id,
  reputationScore: 5.0,
  totalRatings: 1,
  save: async () => {}
});

// Mock Email Service
const emailService = require('../services/emailService');
emailService.sendNotificationEmail = async () => {};

const runTests = async () => {
  console.log("Running Manual QR Payment Transaction Tests...\n");

  const buyerReq = {
    user: { _id: "buyer123", name: "Buyer", eduEmail: "buyer@test.com" },
    body: {
      bookId: "book123",
      requestType: "Delivery",
      paymentMethod: "esewa"
    }
  };

  try {
    // Test 1: Create Request
    let res = mockRes();
    await transactionController.createTransaction(buyerReq, res);
    assert(res.statusCode === 201, "Should create transaction successfully");
    const tId = res.data.transaction._id;
    console.log("Test 1 Passed: Transaction Request Created");

    // Test 2: Prevent Duplicate Active Request
    let dupRes = mockRes();
    await transactionController.createTransaction(buyerReq, dupRes);
    if (dupRes.statusCode !== 400) console.log("dupRes:", dupRes);
    assert(dupRes.statusCode === 400, "Should prevent duplicate requests");
    console.log("Test 2 Passed: Duplicate active request prevented");

    // Test 3: Unauthorized Accept (Buyer tries to accept)
    let unauthorizedRes = mockRes();
    await transactionController.respondToTransaction({
      user: { _id: "buyer123" },
      params: { id: tId },
      body: { action: "accepted" }
    }, unauthorizedRes);
    if (unauthorizedRes.statusCode !== 403) console.log("unauthorizedRes:", unauthorizedRes);
    assert(unauthorizedRes.statusCode === 403, "Buyer cannot accept");
    console.log("Test 3 Passed: Unauthorized acceptance prevented");

    // Test 4: Seller Accepts
    let acceptRes = mockRes();
    await transactionController.respondToTransaction({
      user: { _id: "seller123" },
      params: { id: tId },
      body: { action: "accepted" }
    }, acceptRes);
    assert(acceptRes.statusCode === 200, "Seller should accept");
    
    const t = transactions.find(t => t._id.toString() === tId.toString());
    assert(t.status === "payment_pending", "Status should be payment_pending for priced book");
    console.log("Test 4 Passed: Seller Accepted and status updated");

    // Test 5: Get QR Code
    let qrRes = mockRes();
    // we need to mock transaction.lister to have esewaQR
    t.lister = { _id: "seller123", esewaQR: "/uploads/esewa-qr/test.png" };
    
    await transactionController.getPaymentQR({
      user: { _id: "buyer123" },
      params: { id: tId }
    }, qrRes);
    assert(qrRes.statusCode === 200, "Should return QR");
    assert(qrRes.data.qrUrl === "/uploads/esewa-qr/test.png", "QR matches seller profile");
    console.log("Test 5 Passed: QR retrieved correctly");

    // Test 6: Upload Payment Proof
    let proofRes = mockRes();
    await transactionController.uploadPaymentProof({
      user: { _id: "buyer123" },
      params: { id: tId },
      file: { filename: "proof.png" }
    }, proofRes);
    const getLatestT = () => transactions.find(tx => tx._id.toString() === tId.toString());
    assert(proofRes.statusCode === 200, "Should upload proof");
    assert(getLatestT().status === "payment_uploaded", "Status should update to payment_uploaded");
    console.log("Test 6 Passed: Payment proof uploaded");

    // Test 7: Verify Payment
    let verifyRes = mockRes();
    await transactionController.verifyPayment({
      user: { _id: "seller123" },
      params: { id: tId },
      body: { action: "verified" }
    }, verifyRes);
    assert(verifyRes.statusCode === 200, "Should verify payment");
    assert(getLatestT().status === "payment_completed", "Status should update to payment_completed");
    console.log("Test 7 Passed: Payment verified by seller");

    // Test 8: Complete Transaction
    let completeRes = mockRes();
    await transactionController.completeTransaction({
      user: { _id: "buyer123" },
      params: { id: tId }
    }, completeRes);
    if (completeRes.statusCode !== 200) console.log("completeRes:", completeRes);
    assert(completeRes.statusCode === 200, "Should complete transaction");
    assert(getLatestT().status === "completed", "Status should update to completed");
    console.log("Test 8 Passed: Transaction completed");

    console.log("\n✅ All Transaction Tests Passed Successfully!");
  } catch (e) {
    console.error("❌ Test Failed:", e);
    process.exit(1);
  }
};

runTests();
