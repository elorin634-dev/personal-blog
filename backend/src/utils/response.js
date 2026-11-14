'use strict';

/**
 * 统一成功响应：{ code, message, data }
 * code = 0 表示成功，data 永远存在（无内容时为 null），前端无需判空
 */
function success(res, data = null, message = 'ok', statusCode = 200) {
  return res.status(statusCode).json({ code: 0, message, data });
}

/**
 * 分页响应的 data 结构，列表与分页信息放在一起
 */
function paginated(res, list, pagination) {
  return success(res, { list, pagination });
}

module.exports = { success, paginated };
