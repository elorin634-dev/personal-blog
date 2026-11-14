'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const config = require('./config/env');
const apiRoutes = require('./routes');
const requestLogger = require('./middlewares/requestLogger');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const ApiError = require('./utils/ApiError');

const app = express();

// 不暴露 Express 版本号
app.disable('x-powered-by');

// 基础安全响应头（nosniff / frameguard 等）
app.use(helmet());

// 信任反向代理时才能拿到真实 IP；本地直连保持默认，避免伪造 X-Forwarded-For
// 部署到 Nginx 之后可设置 TRUST_PROXY=1（见 README）
if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

/**
 * CORS：只放行配置中的前端地址
 * 无 Origin 的请求（curl、服务端调用）放行；生产环境禁止 *
 */
const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new ApiError(403, `不允许的跨域来源：${origin}`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  maxAge: 86400,
};
app.use(cors(corsOptions));

// 请求体限制，防止超大 JSON 占满内存
app.use(express.json({ limit: '100kb' }));

app.use(requestLogger);

// 根路径给出可读提示，避免访问 / 时看到 404 而误判服务未启动
app.get('/', (req, res) => {
  res.json({
    code: 0,
    message: '个人博客 API 已启动',
    data: {
      apiBase: '/api/v1',
      health: '/api/v1/health',
      docs: 'docs/api.md',
    },
  });
});

app.use('/api/v1', apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
