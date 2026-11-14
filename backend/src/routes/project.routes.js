'use strict';

const express = require('express');
const projectController = require('../controllers/projectController');
const asyncHandler = require('../utils/asyncHandler');
const { validateSlugParam } = require('../middlewares/validate');

const router = express.Router();

router.get('/', asyncHandler(projectController.listProjects));
router.get('/:slug', validateSlugParam('slug'), asyncHandler(projectController.getProject));

module.exports = router;
