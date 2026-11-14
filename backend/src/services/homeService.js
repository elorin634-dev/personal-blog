'use strict';

const configService = require('./configService');
const projectService = require('./projectService');
const articleService = require('./articleService');

/**
 * 主页聚合：一个请求返回首屏所需全部数据，减少移动端往返
 * 四个查询互不依赖，用 Promise.all 并行
 */
async function getHomeData() {
  const [siteProfile, projects, latestArticles, articleCount] = await Promise.all([
    configService.getSiteProfile(),
    projectService.listPublished({ limit: 3 }),
    articleService.listLatest(5),
    articleService.countPublished(),
  ]);

  return {
    ...siteProfile,
    featuredProjects: projects.list,
    latestArticles,
    stats: {
      projectCount: projects.total,
      articleCount,
    },
  };
}

module.exports = { getHomeData };
