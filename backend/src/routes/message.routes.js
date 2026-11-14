'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const messageController = require('../controllers/messageController');
const asyncHandler = require('../utils/asyncHandler');
const { validateMessagePayload } = require('../middlewares/validate');

const router = express.Router();

/**
 * 游客留言防刷：按 IP 限流（默认每小时 3 条）
 * 与蜜罐字段配合，v1.1 不引入验证码
 */
const messageRateLimiter = rateLimit({
  windowMs: config.messageRateLimit.windowMs,
  max: config.messageRateLimit.max,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      code: 42900,
      message: '留言太频繁了，请稍后再试',
      data: null,
    });
  },
});

router.post(
  '/',
  messageRateLimiter,
  validateMessagePayload,
  asyncHandler(messageController.createMessage)
);

module.exports = router;
