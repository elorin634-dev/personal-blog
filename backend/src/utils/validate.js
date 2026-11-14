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

/** 按 Unicode 字符计数，避免 emoji 被算成两个字符 */
function textLength(value) {
  return Array.from(String(value ?? '')).length;
}

/**
 * 收敛用户输入：统一换行、去首尾空白；单行字段再把连续空白压成一个空格
 */
function normalizeText(value, { singleLine = false } = {}) {
  if (typeof value !== 'string') return '';
  let text = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (singleLine) {
    text = text.replace(/\s+/g, ' ');
  }
  return text;
}

/**
 * 把用户输入收敛成纯文本并按字符数截断
 * 留言接口已经按长度校验，不需要截断；保留此工具供后续评论等写入场景使用
 */
function toSafeText(value, maxLength = 1000) {
  const normalized = normalizeText(value);
  if (textLength(normalized) <= maxLength) return normalized;
  return Array.from(normalized).slice(0, maxLength).join('');
}

module.exports = { isValidSlug, isEmail, textLength, normalizeText, toSafeText };
