'use strict';

const articleService = require('../services/articleService');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/response');

async function listArticles(req, res) {
  // req.pagination 由 validatePaginationQuery 中间件注入
  const data = await articleService.listPublished(req.pagination);
  return success(res, data);
}

async function getArticle(req, res) {
  const article = await articleService.getBySlug(req.params.slug);
  return success(res, article);
}

async function increaseView(req, res) {
  const rawId = req.params.id;
  if (!/^\d+$/.test(rawId)) {
    throw ApiError.badRequest('文章 id 必须是正整数');
  }

  const data = await articleService.incrementViewCount(Number.parseInt(rawId, 10));
  return success(res, data, '阅读次数已更新');
}

module.exports = { listArticles, getArticle, increaseView };
