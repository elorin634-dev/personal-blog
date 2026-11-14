'use strict';

const db = require('../config/db');
const articleService = require('./articleService');
const ApiError = require('../utils/ApiError');
const { buildPagination } = require('../utils/pagination');
const { serializeComment } = require('../utils/serialize');

// v1.2 评论即时展示：提交即 approved
// 后续需要审核时，把这里改为 'pending' 即可，表结构与前台列表逻辑无需调整
const SUBMIT_STATUS = 'approved';

// 公开列表只查展示字段，绝不 SELECT email / ip / user_agent
const PUBLIC_COLUMNS = 'id, nickname, content, created_at';

async function assertArticlePublished(articleId) {
  const exists = await articleService.existsPublished(articleId);
  if (!exists) {
    throw ApiError.notFound('文章不存在或未发布');
  }
}

/**
 * 某篇文章的公开评论：仅 approved，按时间正序
 */
async function listApproved(articleId, pagination) {
  await assertArticlePublished(articleId);

  const { page, pageSize, offset, limit } = pagination;

  const [rows, countRows] = await Promise.all([
    db.query(
      `SELECT ${PUBLIC_COLUMNS} FROM comments
       WHERE article_id = ? AND status = 'approved'
       ORDER BY created_at ASC, id ASC
       LIMIT ? OFFSET ?`,
      [articleId, limit, offset]
    ),
    db.query(
      "SELECT COUNT(*) AS total FROM comments WHERE article_id = ? AND status = 'approved'",
      [articleId]
    ),
  ]);

  return {
    list: rows.map(serializeComment),
    pagination: buildPagination(page, pageSize, countRows[0].total),
  };
}

/**
 * 新增匿名评论
 * - parent_id 显式写 NULL：v1.2 不做嵌套，字段为后续回复能力预留
 * - 记录 ip / user_agent 供风控使用，公开列表不会返回
 */
async function create(articleId, { nickname, email, content, ip, userAgent }) {
  await assertArticlePublished(articleId);

  const result = await db.query(
    `INSERT INTO comments
       (article_id, parent_id, nickname, email, content, status, ip, user_agent)
     VALUES (?, NULL, ?, ?, ?, ?, ?, ?)`,
    [articleId, nickname, email, content, SUBMIT_STATUS, ip, userAgent]
  );

  const rows = await db.query(
    `SELECT ${PUBLIC_COLUMNS} FROM comments WHERE id = ? LIMIT 1`,
    [result.insertId]
  );

  return serializeComment(rows[0]);
}

module.exports = { listApproved, create };
