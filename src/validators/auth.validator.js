'use strict';
const Joi = require('joi');

/**
 * Joi validation schema for POST /api/auth/register.
 *
 * Rules:
 *   email    — required, valid email format, normalised to lowercase
 *   password — required, minimum 6 characters
 */
const registerSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
});

/**
 * Joi validation schema for POST /api/auth/login.
 *
 * Rules:
 *   email    — required, valid email format
 *   password — required
 */
const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

module.exports = { registerSchema, loginSchema };
