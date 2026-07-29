/**
 * AppError — Custom operational error class.
 * Used by the service layer to throw errors with HTTP status codes.
 * The global error handler in server.js catches these and sends JSON responses.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
