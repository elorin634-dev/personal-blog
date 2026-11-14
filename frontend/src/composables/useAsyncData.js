import { ref, shallowRef } from 'vue';

/**
 * 极简数据请求组合式函数
 * - 统一 loading / error / data
 * - 用自增 requestId 丢弃过期响应，避免快速切换路由时旧数据覆盖新页面
 */
export function useAsyncData(loader) {
  const data = shallowRef(null);
  const loading = ref(false);
  const error = ref('');
  let requestId = 0;

  async function execute(...args) {
    const current = ++requestId;
    loading.value = true;
    error.value = '';

    try {
      const result = await loader(...args);
      if (current === requestId) data.value = result;
      return result;
    } catch (err) {
      if (current === requestId) {
        error.value = err?.message || '加载失败，请稍后重试';
        data.value = null;
      }
      return null;
    } finally {
      if (current === requestId) loading.value = false;
    }
  }

  return { data, loading, error, execute };
}
