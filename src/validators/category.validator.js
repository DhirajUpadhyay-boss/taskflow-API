'use strict';
const Joi = require('joi');

const createCategorySchema = Joi.object({
  name: Joi.string().trim().max(50).required().messages({
    'string.max': 'Category name cannot exceed 50 characters',
    'any.required': 'Category name is required',
  }),
  description: Joi.string().trim().allow('').optional(),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().max(50).optional().messages({
    'string.max': 'Category name cannot exceed 50 characters',
  }),
  description: Joi.string().trim().allow('').optional(),
}).min(1);

module.exports = { createCategorySchema, updateCategorySchema };
