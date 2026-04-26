'use strict';
require('dotenv').config();

const app = require('./src/app');
const agendaService = require('./src/services/agenda.service');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Initialize Agenda
    await agendaService.init();

    const server = app.listen(PORT, () => {
      console.log(`\n🚀  Server running on http://localhost:${PORT}`);
      console.log(`   Environment : ${process.env.NODE_ENV || 'development'}\n`);
    });

    // Graceful shutdown on unhandled errors
    process.on('unhandledRejection', (err) => {
      console.error('❌  Unhandled Rejection:', err.message);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

process.on('uncaughtException', (err) => {
  console.error('❌  Uncaught Exception:', err.message);
  process.exit(1);
});
