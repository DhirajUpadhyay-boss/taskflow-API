'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Mongoose schema for a User document.
 *
 * Fields:
 *   email      — required, unique, stored lowercase
 *   password   — required, bcrypt hash (never returned in queries via select: false)
 *   createdAt  — auto-managed by Mongoose timestamps
 */
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned in query results by default
    },
  },
  { timestamps: true }
);

/**
 * Pre-save hook — hash password only when it is new or modified.
 * This prevents re-hashing an already hashed password on other updates.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Instance method — compare a plain-text candidate with the stored hash.
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
