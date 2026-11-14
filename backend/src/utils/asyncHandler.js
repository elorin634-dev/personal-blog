'use strict';

/**
 * 包装 async 控制器，把 rejected Promise 交给 Express 错误中间件
 * 这样 controller 里只写「成功路径」，不必到处 try/catch
 */
module.exports = function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
