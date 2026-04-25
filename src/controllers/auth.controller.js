'use strict';
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * POST /api/auth/register
 *
 * Registers a new user.
 *   1. Checks email uniqueness → 409 if already exists.
 *   2. Creates the user (password hashed by the pre-save hook in user.model.js).
 *   3. Returns 201 with user data (no password — select:false on schema).
 */
const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      const err = new Error('An account with this email already exists');
      err.statusCode = 409;
      return next(err);
    }

    // Create user — password is hashed by the pre-save hook
    const user = await User.create({ email, password });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { id: user._id, email: user.email, createdAt: user.createdAt },
    });
  } catch (err) {
    // Mongoose unique index race-condition (duplicate key)
    if (err.code === 11000) {
      const error = new Error('An account with this email already exists');
      error.statusCode = 409;
      return next(error);
    }
    next(err);
  }
};

/**
 * POST /api/auth/login
 *
 * Authenticates a user and returns a signed JWT.
 *   1. Looks up user by email (explicitly selecting password field).
 *   2. Compares plain password with hash via user.comparePassword().
 *   3. Signs a JWT containing { id, email }.
 *
 * Note: Both "user not found" and "wrong password" return 401 with the
 *       same message to prevent email enumeration attacks.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // .select('+password') overrides the select:false on the schema
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      return next(err);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      return next(err);
    }

    // Sign JWT with MongoDB _id as id field
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { token },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
