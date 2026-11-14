'use strict';

const db = require('../config/db');
const ApiError = require('../utils/ApiError');
const { buildPagination } = require('../utils/pagination');
const { serializeArticleListItem, serializeArticleDetail } = require('../utils/serialize');

// 列表不查 content，正文只在详情接口返回
const LIST_COLUMNS = `
  id, title, slug, summary, cover_url, tags, view_count, published_at
`;

/**
 * 已发布文章分页列表
 * @param {{ page: number, pageSize: number, offset: number, limit: number }} pagination
 */
async function listPublished(pagination) {
  const { page, pageSize, offset, limit } = pagination;

  const [rows, countRows] = await Promise.all([
    db.query(
      `SELECT ${LIST_COLUMNS} FROM articles
       WHERE status = 'published'
       ORDER BY published_at DESC, id DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    ),
    db.query("SELECT COUNT(*) AS total FROM articles WHERE status = 'published'"),
  ]);

  const total = countRows[0].total;
  return {
    list: rows.map(serializeArticleListItem),
    pagination: buildPagination(page, pageSize, total),
  };
}

/** 主页最新文章：复用列表查询，固定第一页 */
async function listLatest(limit = 5) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 5, 20));
  const rows = await db.query(
    `SELECT ${LIST_COLUMNS} FROM articles
     WHERE status = 'published'
     ORDER BY published_at DESC, id DESC
     LIMIT ?`,
    [safeLimit]
  );
  return rows.map(serializeArticleListItem);
}

async function getBySlug(slug) {
  const rows = await db.query(
    `SELECT id, title, slug, summary, content, cover_url, tags,
            status, view_count, published_at, created_at, updated_at
     FROM articles
     WHERE slug = ? AND status = 'published'
     LIMIT 1`,
    [slug]
  );

  if (rows.length === 0) {
    throw ApiError.notFound('文章不存在或未发布');
  }
  return serializeArticleDetail(rows[0]);
}

/**
 * 阅读次数 +1
 * 使用 view_count = view_count + 1 让数据库做原子自增，避免读改写造成丢计数
 * status 条件保证草稿文章无法被刷阅读数
 */
async function incrementViewCount(id) {
  const result = await db.query(
    `UPDATE articles
     SET view_count = view_count + 1
     WHERE id = ? AND status = 'published'`,
    [id]
  );

  if (result.affectedRows === 0) {
    throw ApiError.notFound('文章不存在或未发布');
  }

  const rows = await db.query('SELECT view_count FROM articles WHERE id = ? LIMIT 1', [id]);
  return { id, viewCount: rows[0].view_count };
}

/** 供预留的评论接口校验文章是否存在 */
async function existsPublished(id) {
  const rows = await db.query(
    "SELECT id FROM articles WHERE id = ? AND status = 'published' LIMIT 1",
    [id]
  );
  return rows.length > 0;
}

/** 已发布文章总数，主页统计用 */
async function countPublished() {
  const rows = await db.query("SELECT COUNT(*) AS total FROM articles WHERE status = 'published'");
  return rows[0].total;
}

module.exports = {
  listPublished,
  listLatest,
  getBySlug,
  incrementViewCount,
  existsPublished,
  countPublished,
};
