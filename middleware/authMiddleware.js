const User = require('../models/User');
const AppError = require('../utils/AppError');
const { verifyToken } = require('../utils/jwt');

/**
 * Auth Middleware — protects routes that require a logged-in user.
 *
 * How it works:
 * 1. Client sends: Authorization: Bearer <JWT>
 * 2. Middleware extracts the token from the header
 * 3. verifyToken() decodes the JWT using JWT_SECRET from .env
 * 4. The decoded payload contains { id: userId } — set at login/signup
 * 5. User is loaded from MongoDB and attached to req.user
 * 6. next() passes control to the controller
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authorized. Please login first.', 401));
  }

  try {
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new AppError('User belonging to this token no longer exists.', 401));
    }

    if (!user.isVerified) {
      return next(
        new AppError('Please verify your email before accessing this resource.', 401)
      );
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new AppError('Token is invalid or expired. Please login again.', 401));
  }
};

/**
 * restrictTo — Role-based access control (used in later modules).
 * Example: restrictTo('seller') allows only sellers.
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }
  next();
};

module.exports = { protect, restrictTo };
