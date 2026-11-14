'use strict';

const ApiError = require('../utils/ApiError');
const { isValidSlug, isEmail, textLength, normalizeText } = require('../utils/validate');
const { parsePagination } = require('../utils/pagination');

const MESSAGE_LIMITS = {
  nameMin: 2,
  nameMax: 30,
  contentMin: 5,
  contentMax: 1000,
};

const COMMENT_LIMITS = {
  nicknameMin: 2,
  nicknameMax: 30,
  contentMin: 1,
  contentMax: 500,
};

/**
 * 校验 :slug 路径参数，非法格式直接 400，避免把脏值送进 SQL
 */
function validateSlugParam(paramName = 'slug') {
  return function slugParamGuard(req, res, next) {
    const value = req.params[paramName];
    if (!isValidSlug(value)) {
      return next(ApiError.badRequest('slug 格式不合法'));
    }
    return next();
  };
}

/**
 * 解析分页参数并挂到 req.pagination，controller 直接用
 */
function validatePaginationQuery(req, res, next) {
  try {
    req.pagination = parsePagination(req.query);
    return next();
  } catch (error) {
    return next(error);
  }
}

/**
 * 校验游客留言
 * - name / content 必填，email 选填
 * - 蜜罐字段 website 有值视为机器人：不校验、不入库，由 controller 返回假成功
 * - 校验通过后把清洗结果挂到 req.message，controller 只负责入库
 */
function validateMessagePayload(req, res, next) {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};

  const honeypot = typeof body.website === 'string' ? body.website.trim() : '';
  if (honeypot) {
    req.message = { isBot: true };
    return next();
  }

  const name = normalizeText(body.name, { singleLine: true });
  const email = normalizeText(body.email, { singleLine: true }).toLowerCase();
  const content = normalizeText(body.content);

  const details = {};
  const nameSize = textLength(name);
  const contentSize = textLength(content);

  if (nameSize < MESSAGE_LIMITS.nameMin || nameSize > MESSAGE_LIMITS.nameMax) {
    details.name = `昵称需为 ${MESSAGE_LIMITS.nameMin}-${MESSAGE_LIMITS.nameMax} 个字符`;
  }
  if (email && !isEmail(email)) {
    details.email = '邮箱格式不正确';
  }
  if (contentSize < MESSAGE_LIMITS.contentMin) {
    details.content = `留言内容至少 ${MESSAGE_LIMITS.contentMin} 个字符`;
  } else if (contentSize > MESSAGE_LIMITS.contentMax) {
    details.content = `留言内容不能超过 ${MESSAGE_LIMITS.contentMax} 个字符`;
  }

  if (Object.keys(details).length > 0) {
    return next(ApiError.badRequest('请检查填写内容', details));
  }

  req.message = {
    name,
    email,
    content,
    isBot: false,
    ip: String(req.ip || '').slice(0, 45),
    userAgent: String(req.get('user-agent') || '').slice(0, 500),
  };
  return next();
}

/**
 * 校验数字 ID 路径参数（评论接口用）
 */
function validateNumericIdParam(paramName = 'id') {
  return function numericIdGuard(req, res, next) {
    const raw = req.params[paramName];
    if (!/^\d+$/.test(String(raw || ''))) {
      return next(ApiError.badRequest(`${paramName} 必须是正整数`));
    }
    const value = Number.parseInt(raw, 10);
    if (!Number.isSafeInteger(value) || value < 1) {
      return next(ApiError.badRequest(`${paramName} 必须是正整数`));
    }
    return next();
  };
}

/** 评论列表分页：默认每页 20 条 */
function validateCommentPagination(req, res, next) {
  try {
    req.pagination = parsePagination(req.query, { defaultPageSize: 20, maxPageSize: 50 });
    return next();
  } catch (error) {
    return next(error);
  }
}

/**
 * 校验匿名评论
 * - nickname / content 必填，email 选填
 * - 蜜罐字段 website 有值视为机器人，交由 controller 返回假成功、不入库
 * - 评论内容按纯文本保存，前端必须用文本插值渲染
 */
function validateCommentPayload(req, res, next) {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};

  const honeypot = typeof body.website === 'string' ? body.website.trim() : '';
  if (honeypot) {
    req.comment = { isBot: true, nickname: '', email: '', content: '' };
    return next();
  }

  const nickname = normalizeText(body.nickname, { singleLine: true });
  const email = normalizeText(body.email, { singleLine: true }).toLowerCase();
  const content = normalizeText(body.content);

  const details = {};
  const nicknameSize = textLength(nickname);
  const contentSize = textLength(content);

  if (nicknameSize < COMMENT_LIMITS.nicknameMin || nicknameSize > COMMENT_LIMITS.nicknameMax) {
    details.nickname = `昵称需为 ${COMMENT_LIMITS.nicknameMin}-${COMMENT_LIMITS.nicknameMax} 个字符`;
  }
  if (email && !isEmail(email)) {
    details.email = '邮箱格式不正确';
  }
  if (contentSize < COMMENT_LIMITS.contentMin) {
    details.content = '评论内容不能为空';
  } else if (contentSize > COMMENT_LIMITS.contentMax) {
    details.content = `评论内容不能超过 ${COMMENT_LIMITS.contentMax} 个字符`;
  }

  if (Object.keys(details).length > 0) {
    return next(ApiError.badRequest('请检查填写内容', details));
  }

  req.comment = {
    nickname,
    email,
    content,
    isBot: false,
    ip: String(req.ip || '').slice(0, 45),
    userAgent: String(req.get('user-agent') || '').slice(0, 500),
  };
  return next();
}

module.exports = {
  validateSlugParam,
  validatePaginationQuery,
  validateMessagePayload,
  validateNumericIdParam,
  validateCommentPagination,
  validateCommentPayload,
  MESSAGE_LIMITS,
  COMMENT_LIMITS,
};
