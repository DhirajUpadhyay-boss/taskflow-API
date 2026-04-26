'use strict';
const Joi = require('joi');

/**
 * Joi schema for POST /api/tasks (create task).
 *
 * Rules:
 *   title       — required, 1–200 chars
 *   description — optional string
 *   dueDate     — optional ISO 8601 date string (YYYY-MM-DD or full ISO)
 *   status      — optional, must be 'pending' or 'completed' (default: pending)
 */
const createTaskSchema = Joi.object({
  title: Joi.string().trim().max(200).required().messages({
    'string.max': 'Title cannot exceed 200 characters',
    'any.required': 'Title is required',
  }),
  description: Joi.string().trim().allow('').optional(),
  dueDate: Joi.string()
    .isoDate()
    .optional()
    .allow(null, '')
    .messages({
      'string.isoDate': 'dueDate must be a valid ISO 8601 date (e.g. 2024-12-31)',
    }),
  status: Joi.string().valid('pending', 'completed').optional().messages({
    'any.only': 'Status must be pending or completed',
  }),
  categoryId: Joi.string().hex().length(24).optional().allow(null).messages({
    'string.hex': 'Invalid categoryId format',
    'string.length': 'Invalid categoryId format',
  }),
  tags: Joi.array().items(Joi.string().trim()).optional(),
});

/**
 * Joi schema for PATCH /api/tasks/:id (partial update).
 *
 * All fields optional but at least one must be present.
 */
const updateTaskSchema = Joi.object({
  title: Joi.string().trim().max(200).optional().messages({
    'string.max': 'Title cannot exceed 200 characters',
  }),
  description: Joi.string().trim().allow('').optional(),
  dueDate: Joi.string()
    .isoDate()
    .optional()
    .allow(null, '')
    .messages({
      'string.isoDate': 'dueDate must be a valid ISO 8601 date (e.g. 2024-12-31)',
    }),
  status: Joi.string().valid('pending', 'completed').optional().messages({
    'any.only': 'Status must be pending or completed',
  }),
  categoryId: Joi.string().hex().length(24).optional().allow(null).messages({
    'string.hex': 'Invalid categoryId format',
    'string.length': 'Invalid categoryId format',
  }),
  tags: Joi.array().items(Joi.string().trim()).optional(),
}).min(1); // at least one field required for a PATCH

module.exports = { createTaskSchema, updateTaskSchema };
