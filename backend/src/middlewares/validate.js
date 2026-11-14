'use strict';

const ApiError = require('../utils/ApiError');
const { isValidSlug } = require('../utils/validate');
const { parsePagination } = require('../utils/pagination');

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

module.exports = { validateSlugParam, validatePaginationQuery };
