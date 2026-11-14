'use strict';

const ApiError = require('../utils/ApiError');

/**
 * 所有未匹配路由统一返回 404，保持响应格式一致
 */
module.exports = function notFound(req, res, next) {
  next(ApiError.notFound(`接口不存在：${req.method} ${req.originalUrl}`));
};
