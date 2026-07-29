/**
 * asyncHandler — Wraps async route/controller functions.
 * Forwards rejected promises to Express error middleware (no try/catch in every controller).
 */
const asyncHandler = (fn) => (req, res, next) => {
  if (typeof next !== 'function') {
    console.error('asyncHandler: missing next — check route middleware order');
    return res.status(500).json({ success: false, message: 'Internal routing error.' });
  }

  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
