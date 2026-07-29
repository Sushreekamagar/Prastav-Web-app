const crypto = require('crypto');
 
/**
 * eSewa Payment Service — ePay v2
 * Sandbox docs: https://developer.esewa.com.np/
 *
 * Test credentials:
 *   Merchant ID : EPAYTEST
 *   Secret Key  : 8gBm/:&EnhH.1/q
 *   Test eSewa ID : 9806800001 / 002 / 003 / 004 / 005
 *   Password      : Nepal@123
 */
 
// Generate HMAC-SHA256 signature required by eSewa v2
const generateSignature = (totalAmount, transactionUUID, productCode) => {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUUID},product_code=${productCode}`;
  return crypto
    .createHmac('sha256', process.env.ESEWA_SECRET_KEY)
    .update(message)
    .digest('base64');
};
 
/**
 * Build eSewa payment payload
 * Frontend will POST this payload to eSewa's payment URL (form POST)
 * OR generate a QR code from the paymentUrl for the user to scan
 *
 * @param {number} amount         — Price in NPR
 * @param {string} transactionId  — Your MongoDB transaction _id
 * @param {string} bookTitle      — For reference display
 */
const createEsewaPayment = (amount, transactionId, bookTitle) => {
  const productCode = process.env.ESEWA_MERCHANT_ID;
  const transactionUUID = `PRASTAV-${transactionId}-${Date.now()}`;
  const totalAmount = amount;
  const signature = generateSignature(totalAmount, transactionUUID, productCode);
 
  const payload = {
    amount: amount,
    tax_amount: 0,
    total_amount: totalAmount,
    transaction_uuid: transactionUUID,
    product_code: productCode,
    product_service_charge: 0,
    product_delivery_charge: 0,
    success_url: `${process.env.FRONTEND_URL}/payment/esewa/success`,
    failure_url: `${process.env.FRONTEND_URL}/payment/esewa/failure`,
    signed_field_names: 'total_amount,transaction_uuid,product_code',
    signature,
  };
 
  return {
    // Frontend POSTs `payload` to this URL
    paymentUrl: `${process.env.ESEWA_BASE_URL}/api/epay/main/v2/form`,
    payload,
    transactionUUID,
    // Also return as QR data — frontend generates QR from this
    qrData: `${process.env.ESEWA_BASE_URL}/api/epay/main/v2/form`,
  };
};
 
/**
 * Verify eSewa payment after user is redirected back
 * eSewa sends base64-encoded JSON as ?data= query param on success_url
 *
 * @param {string} encodedData — base64 string from eSewa
 */
const verifyEsewaPayment = (encodedData) => {
  try {
    const decoded = JSON.parse(
      Buffer.from(encodedData, 'base64').toString('utf-8')
    );
 
    const { transaction_uuid, total_amount, product_code, status, signature } = decoded;
 
    // Re-compute expected signature and compare
    const expectedSig = generateSignature(total_amount, transaction_uuid, product_code);
 
    if (expectedSig !== signature) {
      return { success: false, message: 'Signature mismatch — possible tampering' };
    }
    if (status !== 'COMPLETE') {
      return { success: false, message: `Payment not complete. Status: ${status}` };
    }
 
    return {
      success: true,
      transactionUUID: transaction_uuid,
      amount: total_amount,
      rawData: decoded,
    };
  } catch (err) {
    return { success: false, message: `Verification error: ${err.message}` };
  }
};
 
module.exports = { createEsewaPayment, verifyEsewaPayment };