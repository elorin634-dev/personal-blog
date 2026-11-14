'use strict';

const path = require('path');
const dotenv = require('dotenv');

// 固定从 backend/.env 读取，避免启动目录不同导致读不到配置
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * 读取必填环境变量，缺失时尽早失败（fail fast）
 */
function required(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    if (fallback !== undefined) return fallback;
    throw new Error(`[env] 缺少必填环境变量：${name}（请参考 backend/.env.example）`);
  }
  return value;
}

function optionalInt(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

const nodeEnv = process.env.NODE_ENV || 'development';

const config = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: optionalInt('PORT', 3000),

  db: {
    host: required('DB_HOST', '127.0.0.1'),
    port: optionalInt('DB_PORT', 3306),
    user: required('DB_USER', 'root'),
    // 本地 MySQL 允许空密码，因此这里不做必填校验
    password: process.env.DB_PASSWORD || '',
    database: required('DB_NAME', 'personal_blog'),
    connectionLimit: optionalInt('DB_CONNECTION_LIMIT', 10),
  },

  // 'http://localhost:5173,http://127.0.0.1:5173' -> ['http://localhost:5173', 'http://127.0.0.1:5173']
  corsOrigins: required('CORS_ORIGIN', 'http://localhost:5173')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),

  viewRateLimit: {
    windowMs: optionalInt('VIEW_RATE_WINDOW_MS', 60 * 1000),
    max: optionalInt('VIEW_RATE_MAX', 30),
  },

  // 游客留言：默认每 IP 每小时 3 条，够正常沟通，也能挡住脚本刷屏
  messageRateLimit: {
    windowMs: optionalInt('MESSAGE_RATE_WINDOW_MS', 60 * 60 * 1000),
    max: optionalInt('MESSAGE_RATE_MAX', 3),
  },
};

// 生产环境不允许通配符跨域，避免配置事故
if (config.isProduction && config.corsOrigins.includes('*')) {
  throw new Error('[env] 生产环境 CORS_ORIGIN 不能为 *');
}

module.exports = config;
