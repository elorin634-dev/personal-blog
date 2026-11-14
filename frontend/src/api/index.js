import http from './http';

/** 主页聚合数据：站点信息、精选项目、最新文章、统计 */
export function fetchHome() {
  return http.get('/home');
}

/** 项目列表（仅已发布） */
export function fetchProjects() {
  return http.get('/projects');
}

/** 项目详情 */
export function fetchProject(slug) {
  return http.get(`/projects/${encodeURIComponent(slug)}`);
}

/** 文章分页列表 */
export function fetchArticles({ page = 1, pageSize = 6 } = {}) {
  return http.get('/articles', { params: { page, pageSize } });
}

/** 文章详情 */
export function fetchArticle(slug) {
  return http.get(`/articles/${encodeURIComponent(slug)}`);
}

/**
 * 阅读次数 +1
 * 后端按 IP 限流；前端另有 localStorage 去重，见 views/ArticleDetailView.vue
 */
export function increaseArticleView(id) {
  return http.post(`/articles/${id}/view`);
}

/** 联系板块配置（站点信息、联系方式、社交链接） */
export function fetchContact() {
  return http.get('/contact');
}
