/**
 * 统一 Axios 实例
 * - baseURL 来自 VITE_API_BASE_URL，未配置时回退 /api/v1（由 Vite 代理转发）
 * - 响应拦截器把 { code, message, data } 解包成 data，业务层不关心外层结构
 * - 所有失败都转成带友好文案的 ApiRequestError，页面只负责展示 error.message
 */
import axios from 'axios';

export class ApiRequestError extends Error {
  constructor(message, { code = null, status = null, details = null } = {}) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = code;
    this.status = status;
    // 字段级校验错误：{ name: '...', content: '...' }
    this.details = details;
  }
}

const baseURL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');

const http = axios.create({
  baseURL,
  timeout: 10000,
  headers: { Accept: 'application/json' },
});

http.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && body.code === 0) {
      return body.data;
    }
    return Promise.reject(
      new ApiRequestError(body?.message || '接口返回数据异常', {
        code: body?.code,
        status: response.status,
        details: body?.data,
      })
    );
  },
  (error) => {
    const status = error.response?.status ?? null;
    const body = error.response?.data;
    let message = body?.message;

    if (!message) {
      if (error.code === 'ECONNABORTED') {
        message = '请求超时，请检查后端服务是否正常';
      } else if (!error.response) {
        message = '无法连接后端服务，请确认已启动并检查 VITE_API_BASE_URL';
      } else if (status === 429) {
        message = '操作太频繁了，请稍后再试';
      } else {
        message = `请求失败（HTTP ${status}）`;
      }
    }

    return Promise.reject(
      new ApiRequestError(message, { code: body?.code, status, details: body?.data })
    );
  }
);

export default http;
