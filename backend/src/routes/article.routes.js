'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const articleController = require('../controllers/articleController');
const asyncHandler = require('../utils/asyncHandler');
const { validateSlugParam, validatePaginationQuery } = require('../middlewares/validate');

const router = express.Router();

/**
 * 阅读数防刷：按 IP 限流
 * 前端还有 localStorage 去重，两层配合即可，不引入验证码/指纹方案
 */
const viewRateLimiter = rateLimit({
  windowMs: config.viewRateLimit.windowMs,
  max: config.viewRateLimit.max,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      code: 42900,
      message: '操作太频繁了，请稍后再试',
      data: null,
    });
  },
});

router.get('/', validatePaginationQuery, asyncHandler(articleController.listArticles));
router.get('/:slug', validateSlugParam('slug'), asyncHandler(articleController.getArticle));
router.post('/:id/view', viewRateLimiter, asyncHandler(articleController.increaseView));

module.exports = router;
