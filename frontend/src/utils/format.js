/**
 * 展示层格式化工具
 */

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  // 后端返回 '2026-10-28 09:30:00'，转成 ISO 形式由浏览器按本地时区解析
  const date = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** 2026.10.28 */
export function formatDate(value) {
  const date = parseDate(value);
  if (!date) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}.${month}.${day}`;
}

/** 2026 年 10 月 28 日 */
export function formatDateLong(value) {
  const date = parseDate(value);
  if (!date) return '';
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`;
}

/** 12800 -> 1.3 万 */
export function formatCount(value) {
  const count = Number(value) || 0;
  if (count < 10000) return String(count);
  return `${(count / 10000).toFixed(1).replace(/\.0$/, '')} 万`;
}

/** 估时：数字后面统一加单位 */
export function formatMinutes(value) {
  const minutes = Number(value) || 1;
  return `${minutes} 分钟`;
}
