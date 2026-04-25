'use strict';
const jwt = require('jsonwebtoken');

// This middleware acts like a bouncer at a club for our private routes!
// It checks if the user sent a valid "Bearer Token" in their headers.
// If the token is good, it lets them in and attaches their info to req.user.
// If the token is fake or expired, it kicks them out with a 401 error.
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
