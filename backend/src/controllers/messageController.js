'use strict';

const messageService = require('../services/messageService');
const { success } = require('../utils/response');

const SUCCESS_MESSAGE = '留言已收到，审核后会尽快回复';

/**
 * POST /api/v1/messages
 * 无登录、无鉴权；只写入，不回显留言内容，也不提供公开读取
 */
async function createMessage(req, res) {
  const { isBot, ...payload } = req.message;

  // 蜜罐命中：返回与正常提交一致的响应，避免机器人据响应调整策略
  if (isBot) {
    return success(res, { status: 'pending' }, SUCCESS_MESSAGE, 201);
  }

  const data = await messageService.createMessage(payload);
  return success(res, data, SUCCESS_MESSAGE, 201);
}

module.exports = { createMessage };
