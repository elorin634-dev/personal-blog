'use strict';

const app = require('./app');
const config = require('./config/env');
const db = require('./config/db');

async function bootstrap() {
  // 先探测数据库，但不阻塞启动：MySQL 暂时不可用时仍可访问 /api/v1/health 排查
  try {
    await db.ping();
    console.log(`[db] 已连接 MySQL ${config.db.host}:${config.db.port}/${config.db.database}`);
  } catch (error) {
    console.error(`[db] 连接失败：${error.message}`);
    console.error('[db] 服务仍会启动，请检查 .env 与 MySQL 状态，健康检查见 /api/v1/health');
  }

  const server = app.listen(config.port, () => {
    console.log(`[server] 运行于 http://localhost:${config.port}（${config.nodeEnv}）`);
    console.log(`[server] API 前缀 /api/v1，健康检查 /api/v1/health`);
  });

  // 优雅退出：先停止接收新请求，再关闭连接池
  const shutdown = (signal) => {
    console.log(`\n[server] 收到 ${signal}，正在关闭...`);
    server.close(async () => {
      try {
        await db.closePool();
        console.log('[server] 已安全退出');
        process.exit(0);
      } catch (error) {
        console.error('[server] 关闭连接池失败:', error.message);
        process.exit(1);
      }
    });

    // 兜底：10 秒内没关完就强制退出，避免进程挂死
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (reason) => {
  console.error('[process] 未处理的 Promise 拒绝:', reason);
});

bootstrap();
