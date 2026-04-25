'use strict';
const express = require('express');
const router = express.Router();

const {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
} = require('../controllers/task.controller');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createTaskSchema, updateTaskSchema } = require('../validators/task.validator');

// All task routes require authentication
router.use(auth);

// POST   /api/tasks         — Create a task
router.post('/', validate(createTaskSchema), createTask);

// GET    /api/tasks         — Get all tasks (current user)
router.get('/', getAllTasks);

// GET    /api/tasks/:id     — Get single task
router.get('/:id', getTaskById);

// PATCH  /api/tasks/:id     — Partial update
router.patch('/:id', validate(updateTaskSchema), updateTask);

// DELETE /api/tasks/:id     — Delete task
router.delete('/:id', deleteTask);

module.exports = router;
