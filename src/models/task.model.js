'use strict';
const mongoose = require('mongoose');

/**
 * Mongoose schema for a Task document.
 *
 * Fields:
 *   userId      — ref to User._id (ObjectId); used for ownership isolation
 *   title       — required, 1-200 chars
 *   description — optional free-text
 *   dueDate     — optional ISO 8601 date; stored as Date
 *   status      — 'pending' (default) | 'completed'
 *   timestamps  — createdAt, updatedAt managed by Mongoose
 */
const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true, // speed up "all tasks for user" queries
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'completed'],
        message: 'Status must be pending or completed',
      },
      default: 'pending',
    },
  },
  { timestamps: true }
);

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
