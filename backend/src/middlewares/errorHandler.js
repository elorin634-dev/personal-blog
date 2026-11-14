'use strict';

const config = require('../config/env');
const ApiError = require('../utils/ApiError');

/** MySQL 驱动层错误 -> 对外可读的 HTTP 错误 */
function mapDatabaseError(error) {
  const dbUnavailableCodes = [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'PROTOCOL_CONNECTION_LOST',
    'ER_ACCESS_DENIED_ERROR',
    'ER_BAD_DB_ERROR',
  ];

  if (dbUnavailableCodes.includes(error.code)) {
    return ApiError.serviceUnavailable('数据库连接不可用，请检查 MySQL 服务与 .env 配置');
  }
  if (error.code === 'ER_DUP_ENTRY') {
    return new ApiError(409, '数据已存在，请勿重复提交');
  }
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return ApiError.badRequest('关联的数据不存在');
  }
  if (error.code === 'ER_DATA_TOO_LONG') {
    return ApiError.badRequest('输入内容超出长度限制');
  }
  return null;
}

/**
 * 统一错误处理中间件（必须保留 4 个参数，Express 才会识别为错误处理器）
 * 原则：对外只给稳定、无内部细节的信息；完整堆栈只进服务端日志
 */
// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  let error = err;

  // JSON 请求体语法错误
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    error = ApiError.badRequest('请求体不是合法的 JSON');
  } else if (error.type === 'entity.too.large') {
    error = new ApiError(413, '请求体过大');
  } else if (!(error instanceof ApiError)) {
    error = mapDatabaseError(error) || error;
  }

  const isKnown = error instanceof ApiError;
  const statusCode = isKnown ? error.statusCode : 500;

  if (statusCode >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: config.isProduction ? undefined : err.stack,
    });
  } else if (!config.isProduction) {
    console.warn(`[warn] ${req.method} ${req.originalUrl} -> ${statusCode} ${error.message}`);
  }

  return res.status(statusCode).json({
    code: isKnown ? error.code : 50000,
    message: isKnown ? error.message : '服务器内部错误，请稍后重试',
    data: isKnown && error.details ? error.details : null,
  });
};
