const axios = require('axios');
 
/**
 * Khalti Payment Service — Epayment API v2
 * Docs: https://docs.khalti.com/khalti-epayment/
 *
 * Test credentials:
 *   Secret key  : test_secret_key_dc74e0fd45f245cd8fb832d19f6f73ec
 *   Test number : 9800000001 (or 0002–0005)
 *   MPIN        : 1111
 *   OTP         : 987654
 */
 
/**
 * Step 1 — Initiate Khalti payment
 * Returns a payment_url — redirect user to it OR generate QR from it
 *
 * @param {number} amountNPR      — Price in NPR (we convert to paisa internally)
 * @param {string} transactionId  — MongoDB transaction _id
 * @param {string} bookTitle      — Purchase name shown in Khalti
 * @param {string} customerName
 * @param {string} customerEmail
 * @param {string} customerPhone
 */
const initiateKhaltiPayment = async ({
  amountNPR,
  transactionId,
  bookTitle,
  customerName,
  customerEmail,
  customerPhone,
}) => {
  try {
    const response = await axios.post(
      `${process.env.KHALTI_BASE_URL}/api/epayment/initiate/`,
      {
        return_url: `${process.env.FRONTEND_URL}/payment/khalti/success`,
        website_url: process.env.FRONTEND_URL,
        amount: amountNPR * 100, // convert NPR → paisa
        purchase_order_id: `PRASTAV-${transactionId}`,
        purchase_order_name: bookTitle,
        customer_info: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone || '9800000001',
        },
      },
      {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
 
    return {
      success: true,
      pidx: response.data.pidx,           // store this to verify later
      paymentUrl: response.data.payment_url, // redirect OR use as QR
      expiresAt: response.data.expires_at,
      qrData: response.data.payment_url,   // frontend generates QR from this
    };
  } catch (err) {
    const msg = err.response?.data?.detail || err.response?.data || err.message;
    return { success: false, message: typeof msg === 'object' ? JSON.stringify(msg) : msg };
  }
};
 
/**
 * Step 2 — Verify Khalti payment after redirect
 * Call this after user returns from Khalti payment_url
 *
 * @param {string} pidx — Payment identifier from initiation step
 */
const verifyKhaltiPayment = async (pidx) => {
  try {
    const response = await axios.post(
      `${process.env.KHALTI_BASE_URL}/api/epayment/lookup/`,
      { pidx },
      {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
 
    const data = response.data;
 
    if (data.status === 'Completed') {
      return {
        success: true,
        pidx: data.pidx,
        khaltiTransactionId: data.transaction_id,
        totalAmountPaisa: data.total_amount,
        totalAmountNPR: data.total_amount / 100,
        status: data.status,
        rawData: data,
      };
    }
 
    return {
      success: false,
      status: data.status,
      message: `Payment not completed. Status: ${data.status}`,
    };
  } catch (err) {
    const msg = err.response?.data?.detail || err.response?.data || err.message;
    return { success: false, message: typeof msg === 'object' ? JSON.stringify(msg) : msg };
  }
};
 
module.exports = { initiateKhaltiPayment, verifyKhaltiPayment };