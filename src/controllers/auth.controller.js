'use strict';
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Register a new user
// 1. Check if the email is already in the database
// 2. If it is new, save the user (the password gets scrambled automatically)
// 3. Send back a success message and the user's basic info
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

// Log a user in
// 1. Find the user in the database by their email, and grab their password
// 2. Check if the typed password matches the scrambled password in the database
// 3. Create a secret JWT token so the user stays logged in without needing to type their password again
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
