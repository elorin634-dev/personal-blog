'use strict';

const db = require('../config/db');
const ApiError = require('../utils/ApiError');
const { serializeProject } = require('../utils/serialize');

const LIST_COLUMNS = `
  id, title, slug, summary, tech_stack, cover_url, repo_url, demo_url, sort_order, created_at
`;

/**
 * 已发布项目列表
 * @param {{ limit?: number }} options 主页精选时传 limit
 */
async function listPublished(options = {}) {
  const { limit } = options;

  // 先把 limit 收敛为正整数再拼接，避免外部值直接进入 SQL
  const safeLimit = limit ? Math.max(1, Math.min(Number(limit) || 0, 50)) : null;
  const limitClause = safeLimit ? ` LIMIT ${safeLimit}` : '';

  const [rows, countRows] = await Promise.all([
    db.query(
      `SELECT ${LIST_COLUMNS} FROM projects
       WHERE status = 'published'
       ORDER BY sort_order ASC, id DESC${limitClause}`
    ),
    db.query("SELECT COUNT(*) AS total FROM projects WHERE status = 'published'"),
  ]);

  return { list: rows.map(serializeProject), total: countRows[0].total };
}

/** 项目详情：草稿项目对外一律视为不存在 */
async function getBySlug(slug) {
  const rows = await db.query(
    `SELECT id, title, slug, summary, description, tech_stack, cover_url,
            repo_url, demo_url, sort_order, created_at, updated_at
     FROM projects
     WHERE slug = ? AND status = 'published'
     LIMIT 1`,
    [slug]
  );

  if (rows.length === 0) {
    throw ApiError.notFound('项目不存在或未发布');
  }
  return serializeProject(rows[0]);
}

module.exports = { listPublished, getBySlug };
