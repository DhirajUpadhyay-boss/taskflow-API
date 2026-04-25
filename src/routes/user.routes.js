'use strict';
const express = require('express');
const router = express.Router();

const { getProfile } = require('../controllers/user.controller');
const auth = require('../middleware/auth');

// GET /api/users/profile  (protected)
router.get('/profile', auth, getProfile);

module.exports = router;
