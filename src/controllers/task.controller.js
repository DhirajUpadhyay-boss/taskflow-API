'use strict';
const Task = require('../models/task.model');

/**
 * Helper — fetch task by _id AND verify ownership.
 * Returns the task document if found and owned by userId.
 * Throws structured errors for 404 and 403.
 */
const getOwnedTask = async (taskId, userId) => {
  const task = await Task.findById(taskId);

  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }

  if (task.userId.toString() !== userId.toString()) {
    const err = new Error('Forbidden: you do not have access to this task');
    err.statusCode = 403;
    throw err;
  }

  return task;
};

// ─── Create Task ──────────────────────────────────────────────────────────────
/**
 * POST /api/tasks
 *
 * Creates a new task for the authenticated user.
 * userId is taken from req.user (JWT payload) — never from request body.
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, dueDate, status } = req.body;

    const task = await Task.create({
      userId: req.user.id,
      title,
      description,
      dueDate: dueDate || null,
      status: status || 'pending',
    });

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task,
    });
  } catch (err) {
    // Mongoose validation errors → 400
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      const error = new Error(messages.join('; '));
      error.statusCode = 400;
      return next(error);
    }
    next(err);
  }
};

// ─── Get All Tasks ────────────────────────────────────────────────────────────
/**
 * GET /api/tasks
 *
 * Returns all tasks belonging to the authenticated user.
 * Sorted by createdAt descending (newest first).
 */
const getAllTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Single Task ──────────────────────────────────────────────────────────
/**
 * GET /api/tasks/:id
 *
 * Returns a single task by MongoDB _id.
 * Enforces ownership — returns 403 if task belongs to another user.
 */
const getTaskById = async (req, res, next) => {
  try {
    const task = await getOwnedTask(req.params.id, req.user.id);

    return res.status(200).json({ success: true, data: task });
  } catch (err) {
    // Handle invalid MongoDB ObjectId format
    if (err.name === 'CastError') {
      const error = new Error('Invalid task ID format');
      error.statusCode = 400;
      return next(error);
    }
    next(err);
  }
};

// ─── Update Task ──────────────────────────────────────────────────────────────
/**
 * PATCH /api/tasks/:id
 *
 * Partially updates a task. Only fields present in req.body are changed.
 * Ownership is verified before update.
 */
const updateTask = async (req, res, next) => {
  try {
    const task = await getOwnedTask(req.params.id, req.user.id);

    const allowedFields = ['title', 'description', 'dueDate', 'status'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    // runValidators ensures Mongoose schema rules are re-checked on update
    await task.save({ validateBeforeSave: true });

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task,
    });
  } catch (err) {
    if (err.name === 'CastError') {
      const error = new Error('Invalid task ID format');
      error.statusCode = 400;
      return next(error);
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      const error = new Error(messages.join('; '));
      error.statusCode = 400;
      return next(error);
    }
    next(err);
  }
};

// ─── Delete Task ──────────────────────────────────────────────────────────────
/**
 * DELETE /api/tasks/:id
 *
 * Deletes a task. Ownership is verified before deletion.
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await getOwnedTask(req.params.id, req.user.id);
    await task.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (err) {
    if (err.name === 'CastError') {
      const error = new Error('Invalid task ID format');
      error.statusCode = 400;
      return next(error);
    }
    next(err);
  }
};

module.exports = { createTask, getAllTasks, getTaskById, updateTask, deleteTask };
