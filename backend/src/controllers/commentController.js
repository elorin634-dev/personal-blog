'use strict';

const commentService = require('../services/commentService');
const { success } = require('../utils/response');

/**
 * GET /api/v1/articles/:id/comments
 * 公开列表只包含 approved 评论，字段见 serializeComment
 */
async function listComments(req, res) {
  const articleId = Number.parseInt(req.params.id, 10);
  const data = await commentService.listApproved(articleId, req.pagination);
  return success(res, data);
}

/**
 * POST /api/v1/articles/:id/comments
 * 无需登录；v1.2 提交即 approved，立即在前台展示
 */
async function createComment(req, res) {
  const articleId = Number.parseInt(req.params.id, 10);
  const { isBot, ...payload } = req.comment;

  // 蜜罐命中：返回与正常提交一致的成功响应，但不写库
  if (isBot) {
    return success(
      res,
      {
        id: 0,
        nickname: payload.nickname || '访客',
        content: payload.content || '',
        createdAt: new Date().toISOString(),
      },
      '评论已发布',
      201
    );
  }

  const comment = await commentService.create(articleId, payload);
  return success(res, comment, '评论已发布', 201);
}

module.exports = { listComments, createComment };
