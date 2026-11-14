'use strict';

// slug 只允许小写字母、数字与单个连字符分隔
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isValidSlug(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 220 && SLUG_PATTERN.test(value);
}

function isEmail(value) {
  return typeof value === 'string' && value.length <= 190 && EMAIL_PATTERN.test(value);
}

/**
 * 把用户输入收敛成纯文本：去首尾空格、合并连续空行、按长度截断
 * v1.0 没有写入接口；预留的评论 / 留言接口必须先用它清洗再入库
 */
function toSafeText(value, maxLength = 1000) {
  if (typeof value !== 'string') return '';
  const normalized = value.replace(/\r\n/g, '\n').trim();
  return normalized.length > maxLength ? normalized.slice(0, maxLength) : normalized;
}

module.exports = { isValidSlug, isEmail, toSafeText };
