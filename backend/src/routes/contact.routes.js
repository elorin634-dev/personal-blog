'use strict';

const express = require('express');
const contactController = require('../controllers/contactController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(contactController.getContact));

module.exports = router;
