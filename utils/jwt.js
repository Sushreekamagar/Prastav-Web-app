const jwt = require('jsonwebtoken');

/**
 * signToken — Creates a signed JWT containing the user's MongoDB _id.
 * Expiry is controlled by JWT_EXPIRES_IN in .env (default 24h).
 */
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });

/**
 * verifyToken — Decodes and validates a JWT string.
 * Throws jsonwebtoken errors if invalid or expired (caught by auth middleware).
 */
const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

module.exports = { signToken, verifyToken };
