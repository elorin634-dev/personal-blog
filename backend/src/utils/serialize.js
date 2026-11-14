'use strict';

/**
 * 数据库行 -> API 输出对象
 * 统一在这里做 snake_case 到 camelCase 的转换，controller / service 不重复处理
 */

function splitCommaList(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 粗略估算阅读时长：中文约 300 字/分钟，最少 1 分钟 */
function estimateReadingMinutes(content) {
  const length = stripHtml(content).length;
  return Math.max(1, Math.round(length / 300));
}

function serializeProject(row) {
  const project = {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    techStack: splitCommaList(row.tech_stack),
    coverUrl: row.cover_url || '',
    repoUrl: row.repo_url || '',
    demoUrl: row.demo_url || '',
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };

  // 列表查询不取 description，只有详情才带该字段
  if (row.description !== undefined) {
    project.description = row.description || '';
  }
  return project;
}

/** 列表不返回 content，减少传输体积 */
function serializeArticleListItem(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    coverUrl: row.cover_url || '',
    tags: splitCommaList(row.tags),
    viewCount: row.view_count,
    publishedAt: row.published_at,
  };
}

function serializeArticleDetail(row) {
  return {
    ...serializeArticleListItem(row),
    content: row.content || '',
    readingMinutes: estimateReadingMinutes(row.content),
    updatedAt: row.updated_at,
  };
}

module.exports = {
  splitCommaList,
  estimateReadingMinutes,
  serializeProject,
  serializeArticleListItem,
  serializeArticleDetail,
};
