'use strict';

const db = require('../config/db');

/**
 * 写入一条游客留言
 * - status 固定 pending，等待站主审核（v1.1 不提供前台列表与审核页面）
 * - content 以纯文本存储，未来展示时必须使用文本插值 / 转义，不能直接 innerHTML
 */
async function createMessage({ name, email, content, ip, userAgent }) {
  const result = await db.query(
    `INSERT INTO messages (name, email, content, status, ip, user_agent)
     VALUES (?, ?, ?, 'pending', ?, ?)`,
    [name, email, content, ip, userAgent]
  );

  return { id: result.insertId, status: 'pending' };
}

/**
 * 供后续后台使用：按状态分页查询留言
 * v1.1 不暴露为公开接口，这里先不实现，避免出现无鉴权的读取入口
 */

module.exports = { createMessage };
