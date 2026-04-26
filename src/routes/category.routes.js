'use strict';
const express = require('express');
const router = express.Router();
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require('../controllers/category.controller');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createCategorySchema,
  updateCategorySchema,
} = require('../validators/category.validator');

router.use(auth);

router.route('/').post(validate(createCategorySchema), createCategory).get(getAllCategories);
router
  .route('/:id')
  .get(getCategoryById)
  .put(validate(updateCategorySchema), updateCategory)
  .delete(deleteCategory);

module.exports = router;
