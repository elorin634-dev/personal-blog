'use strict';

/**
 * 业务异常：在 service/controller 中抛出，由统一错误中间件转成标准响应
 * 业务码规则：HTTP 状态码 * 100，例如 404 -> 40400
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = statusCode * 100;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = '请求参数有误', details = null) {
    return new ApiError(400, message, details);
  }

  static notFound(message = '资源不存在') {
    return new ApiError(404, message);
  }

  static tooManyRequests(message = '请求过于频繁，请稍后再试') {
    return new ApiError(429, message);
  }

  static serviceUnavailable(message = '服务暂时不可用') {
    return new ApiError(503, message);
  }

  static internal(message = '服务器内部错误') {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;
