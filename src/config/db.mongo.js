'use strict';
const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the MONGO_URI from environment variables.
 * Exits the process if connection fails on startup.
 */
const connectMongo = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI is not defined in environment variables');

    await mongoose.connect(uri);
    console.log('✅  MongoDB connected:', mongoose.connection.host);
  } catch (err) {
    console.error('❌  MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectMongo;
