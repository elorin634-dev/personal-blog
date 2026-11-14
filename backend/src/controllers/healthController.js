'use strict';

const db = require('../config/db');
const config = require('../config/env');
const { success } = require('../utils/response');

/**
 * 健康检查：db 不可用时返回 503，方便部署平台或本地脚本探测
 */
async function checkHealth(req, res) {
  const startedAt = Date.now();

  try {
    await db.ping();
    return success(res, {
      status: 'ok',
      db: 'up',
      dbLatencyMs: Date.now() - startedAt,
      uptimeSeconds: Math.round(process.uptime()),
      env: config.nodeEnv,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[health] 数据库探测失败:', error.message);
    return res.status(503).json({
      code: 50300,
      message: '服务依赖不可用',
      data: {
        status: 'degraded',
        db: 'down',
        env: config.nodeEnv,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

module.exports = { checkHealth };
