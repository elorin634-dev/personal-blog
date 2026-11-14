'use strict';

const ApiError = require('./ApiError');

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

/**
 * 解析并校验分页参数
 * - 未传：使用默认值
 * - 非法（非正整数）：抛 400，而不是静默兜底
 * - 超过上限：直接拒绝，避免一次拉全表
 */
function parsePagination(query, options = {}) {
  const defaultPageSize = options.defaultPageSize || DEFAULT_PAGE_SIZE;
  const maxPageSize = options.maxPageSize || MAX_PAGE_SIZE;

  const page = parsePositiveInt(query.page, 'page', 1);
  const pageSize = parsePositiveInt(query.pageSize, 'pageSize', defaultPageSize);

  if (pageSize > maxPageSize) {
    throw ApiError.badRequest(`pageSize 不能大于 ${maxPageSize}`);
  }

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
    limit: pageSize,
  };
}

function parsePositiveInt(raw, field, defaultValue) {
  if (raw === undefined || raw === '') return defaultValue;

  // 只接受纯数字，拒绝 '1.5'、'1abc'、' 1' 这类模糊输入
  if (!/^\d+$/.test(String(raw))) {
    throw ApiError.badRequest(`${field} 必须是正整数`);
  }

  const value = Number.parseInt(raw, 10);
  if (!Number.isSafeInteger(value) || value < 1) {
    throw ApiError.badRequest(`${field} 必须是正整数`);
  }
  return value;
}

function buildPagination(page, pageSize, total) {
  return {
    page,
    pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
  };
}

module.exports = { parsePagination, buildPagination, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE };
