'use strict';
const jwt = require('jsonwebtoken');

/**
 * Authentication middleware.
 *
 * Expects the Authorization header in the format: Bearer <token>
 *
 * On success: attaches decoded user payload ({ id, email }) to req.user.
 * On failure: passes a structured error to the global error handler.
 *
 * Errors handled:
 *   401 — Missing or malformed Authorization header
 *   401 — Token expired (JsonWebTokenError / TokenExpiredError)
 */
const auth = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const err = new Error('Access denied. No token provided.');
      err.statusCode = 401;
      return next(err);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, iat, exp }
    next();
  } catch (err) {
    // jwt.verify throws JsonWebTokenError or TokenExpiredError
    const error = new Error(
      err.name === 'TokenExpiredError' ? 'Token has expired.' : 'Invalid token.'
    );
    error.statusCode = 401;
    next(error);
  }
};

module.exports = auth;
