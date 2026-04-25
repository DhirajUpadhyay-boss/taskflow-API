'use strict';

/**
 * Joi Validation Middleware Factory.
 *
 * Usage: router.post('/route', validate(schema), controller)
 *
 * @param {import('joi').ObjectSchema} schema - Joi schema to validate against.
 * @param {'body'|'params'|'query'} source - Which part of req to validate (default: 'body').
 *
 * Errors handled:
 *   400 Bad Request — validation fails; returns all error details from Joi.
 */
const validate = (schema, source = 'body') => (req, _res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,   // collect ALL validation errors, not just the first
    stripUnknown: true,  // remove extra fields not in schema
  });

  if (error) {
    const details = error.details.map((d) => d.message.replace(/['"]/g, ''));
    const err = new Error(details.join('; '));
    err.statusCode = 400;
    err.details = details;
    return next(err);
  }

  // Replace req[source] with the sanitised/stripped value
  req[source] = value;
  next();
};

module.exports = validate;
