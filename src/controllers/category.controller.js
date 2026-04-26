'use strict';
const Category = require('../models/category.model');

const getOwnedCategory = async (categoryId, userId) => {
  const category = await Category.findById(categoryId);

  if (!category) {
    const err = new Error('Category not found');
    err.statusCode = 404;
    throw err;
  }

  if (category.userId.toString() !== userId.toString()) {
    const err = new Error('Forbidden: you do not have access to this category');
    err.statusCode = 403;
    throw err;
  }

  return category;
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const category = await Category.create({
      userId: req.user.id,
      name,
      description,
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (err) {
    if (err.code === 11000) {
      const error = new Error('Category with this name already exists');
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

const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ userId: req.user.id }).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
};

const getCategoryById = async (req, res, next) => {
  try {
    const category = await getOwnedCategory(req.params.id, req.user.id);
    return res.status(200).json({ success: true, data: category });
  } catch (err) {
    if (err.name === 'CastError') {
      const error = new Error('Invalid category ID format');
      error.statusCode = 400;
      return next(error);
    }
    next(err);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await getOwnedCategory(req.params.id, req.user.id);

    const { name, description } = req.body;
    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;

    await category.save();

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (err) {
    if (err.code === 11000) {
      const error = new Error('Category with this name already exists');
      error.statusCode = 400;
      return next(error);
    }
    if (err.name === 'CastError') {
      const error = new Error('Invalid category ID format');
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

const deleteCategory = async (req, res, next) => {
  try {
    const category = await getOwnedCategory(req.params.id, req.user.id);
    await category.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (err) {
    if (err.name === 'CastError') {
      const error = new Error('Invalid category ID format');
      error.statusCode = 400;
      return next(error);
    }
    next(err);
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
