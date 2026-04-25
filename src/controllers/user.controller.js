'use strict';
const User = require('../models/user.model');

/**
 * GET /api/users/profile
 *
 * Returns the authenticated user's profile.
 *   - req.user.id is populated by the auth middleware (from JWT payload).
 *   - Fetches fresh data from MongoDB (password excluded via select:false).
 *   - Returns 404 if the user was deleted after the token was issued.
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      return next(err);
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    // Handle invalid MongoDB ObjectId in JWT
    if (err.name === 'CastError') {
      const error = new Error('Invalid user ID in token');
      error.statusCode = 401;
      return next(error);
    }
    next(err);
  }
};

module.exports = { getProfile };
