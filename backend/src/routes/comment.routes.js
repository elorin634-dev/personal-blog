'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const commentController = require('../controllers/commentController');
const asyncHandler = require('../utils/asyncHandler');
const {
  validateNumericIdParam,
  validateCommentPagination,
  validateCommentPayload,
} = require('../middlewares/validate');

// mergeParams: 复用父路由 /articles/:id/comments 中的 :id
const router = express.Router({ mergeParams: true });

/**
 * 评论即时展示，没有人工审核兜底，按 IP 限流是第一道防线
 * 默认每 IP 10 分钟 5 条
 */
const commentRateLimiter = rateLimit({
  windowMs: config.commentRateLimit.windowMs,
  max: config.commentRateLimit.max,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      code: 42900,
      message: '评论太频繁了，请稍后再试',
      data: null,
    });
  },
});

router.get(
  '/',
  validateNumericIdParam('id'),
  validateCommentPagination,
  asyncHandler(commentController.listComments)
);

router.post(
  '/',
  commentRateLimiter,
  validateNumericIdParam('id'),
  validateCommentPayload,
  asyncHandler(commentController.createComment)
);

module.exports = router;
