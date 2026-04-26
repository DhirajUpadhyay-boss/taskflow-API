'use strict';
const Task = require('../models/task.model');
const agendaService = require('../services/agenda.service');
const webhookService = require('../services/webhook.service');

// A helper function to find a task AND make sure the logged-in user actually owns it!
// If the task doesn't exist, we send a 404 error.
// If the task belongs to someone else, we send a 403 Forbidden error.
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
// Create a new task
// We grab the user's ID directly from their secure token, so they can't fake it
const createTask = async (req, res, next) => {
  try {
    const { title, description, dueDate, status, categoryId, tags } = req.body;

    const task = await Task.create({
      userId: req.user.id,
      title,
      description,
      dueDate: dueDate || null,
      status: status || 'pending',
      categoryId: categoryId || null,
      tags: tags || [],
    });

    // Schedule reminder if dueDate is provided
    if (task.dueDate) {
      await agendaService.scheduleReminder(task);
    }

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
// Get all tasks for the logged-in user
// We filter the database by their ID and sort them newest to oldest
const getAllTasks = async (req, res, next) => {
  try {
    const { categoryId, tags } = req.query;
    const query = { userId: req.user.id };

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (tags) {
      // tags can be a single string or an array of strings
      const tagsArray = Array.isArray(tags) ? tags : tags.split(',');
      query.tags = { $all: tagsArray };
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });

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
// Get a single task by its ID
// We use our helper function to make sure they own it first!
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
// Update a task
// First we check if they own it, then we only update the specific fields they sent us
const updateTask = async (req, res, next) => {
  try {
    const task = await getOwnedTask(req.params.id, req.user.id);
    const oldStatus = task.status;
    const oldDueDate = task.dueDate;

    const allowedFields = ['title', 'description', 'dueDate', 'status', 'categoryId', 'tags'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    // runValidators ensures Mongoose schema rules are re-checked on update
    await task.save({ validateBeforeSave: true });

    // Handle Reminder updates
    if (req.body.dueDate !== undefined || req.body.status !== undefined) {
      await agendaService.scheduleReminder(task);
    }

    // Handle Webhook on completion
    if (task.status === 'completed' && oldStatus !== 'completed') {
      const webhookPayload = {
        taskId: task._id,
        title: task.title,
        completionDate: new Date(),
        userId: task.userId,
      };
      // Fire and forget or handle error? The requirement says implement retry logic, 
      // which we did in the service. We'll call it without blocking the response.
      if (process.env.ANALYTICS_WEBHOOK_URL) {
        webhookService.sendWebhook(process.env.ANALYTICS_WEBHOOK_URL, webhookPayload).catch((err) => {
          console.error('Failed to send completion webhook:', err.message);
        });
      }
    }

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
// Delete a task
// First we check if they own it, then we delete it from the database forever
const deleteTask = async (req, res, next) => {
  try {
    const task = await getOwnedTask(req.params.id, req.user.id);
    const taskId = task._id;
    await task.deleteOne();

    // Cancel reminder
    await agendaService.cancelReminder(taskId);

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
