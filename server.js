'use strict';
require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n🚀  Server running on http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}\n`);
});

// Graceful shutdown on unhandled errors
process.on('unhandledRejection', (err) => {
  console.error('❌  Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('❌  Uncaught Exception:', err.message);
  process.exit(1);
});
