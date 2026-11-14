'use strict';

const config = require('../config/env');

/**
 * 极简访问日志，避免为 v1.0 引入额外日志库
 * 生产环境可替换为 pino / winston，结构保持一致即可
 */
module.exports = function requestLogger(req, res, next) {
  if (config.nodeEnv === 'test') return next();

  const startedAt = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    console.log(
      `[http] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms`
    );
  });
  return next();
};
