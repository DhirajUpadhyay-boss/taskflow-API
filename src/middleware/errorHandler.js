'use strict';

/**
 * Global Error Handling Middleware.
 *
 * Catches all errors passed via next(err) and returns a consistent JSON response.
 *
 * Handled status codes:
 *   400 Bad Request      — validation failures, malformed input
 *   401 Unauthorized     — missing/invalid/expired JWT
 *   403 Forbidden        — authenticated but not authorised (e.g., not owner)
 *   404 Not Found        — resource or route not found
 *   409 Conflict         — duplicate unique constraint (e.g., email already exists)
 *   500 Internal Server  — unexpected server-side errors
 *
 * In production (NODE_ENV=production) stack traces are hidden from the response.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  // Default to 500 if no statusCode attached
  const statusCode = err.statusCode || 500;

  const response = {
    success: false,
    message: err.message || 'Internal Server Error',
  };

  // Include field-level details for validation errors
  if (err.details) {
    response.details = err.details;
  }

  // Include stack trace only in development
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  // Log server errors to console for observability
  if (statusCode >= 500) {
    console.error(`[${new Date().toISOString()}] 🔴 ${statusCode} —`, err.message);
    console.error(err.stack);
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
