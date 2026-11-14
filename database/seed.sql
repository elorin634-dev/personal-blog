-- =============================================================
-- 个人博客 v1.0 种子数据
-- 依赖 schema.sql 已执行
-- 使用方法：mysql -u root -p < database/seed.sql
-- 脚本可重复执行：以 slug / config_key 作为唯一键做 UPSERT
-- =============================================================

USE `personal_blog`;

SET NAMES utf8mb4;

-- -------------------------------------------------------------
-- 项目（3 条已发布 + 1 条草稿，用于验证列表只返回 published）
-- -------------------------------------------------------------
INSERT INTO `projects`
  (`title`, `slug`, `summary`, `description`, `tech_stack`, `cover_url`, `repo_url`, `demo_url`, `sort_order`, `status`)
VALUES
  ('PulseBoard 实时监控面板', 'pulseboard',
   '一个用于观察服务健康度的轻量实时面板，支持自定义指标卡与告警阈值。',
   '<h2>项目背景</h2><p>团队内部的多个小服务长期缺少统一的可观测入口，排查问题要在几个平台之间来回切换，于是做了这个面板。</p><h2>核心能力</h2><ul><li>指标卡拖拽排序，布局保存在本地</li><li>基于 SSE 的秒级数据推送，断线自动重连</li><li>阈值告警：连续 3 个采样点越界才触发，避免抖动误报</li></ul><h2>我的角色</h2><p>独立完成前端架构与后端采集服务，前端使用 Composition API 拆分 composable，后端用 Node.js 定时拉取上游指标。</p>',
   'Vue 3,Vite,ECharts,Node.js,SSE', '', 'https://github.com/example/pulseboard', 'https://pulseboard.example.com', 1, 'published'),

  ('Ink CLI 命令行笔记工具', 'ink-cli',
   '为终端重度用户设计的笔记工具，一条命令记录，全文检索秒级返回。',
   '<h2>为什么做它</h2><p>写笔记最怕打断思路。Ink CLI 的目标是「打开终端就能记」：<code>ink add "想法"</code> 之后立刻回到工作。</p><h2>实现要点</h2><ul><li>SQLite + FTS5 做全文索引，万级笔记检索在 20ms 内</li><li>Markdown 存储，纯文本可迁移，不锁定格式</li><li>支持 <code>ink search --tag</code> 组合过滤</li></ul><h2>收获</h2><p>第一次认真处理 CLI 的参数解析与管道输出，也理解了「零配置」背后需要多少默认值设计。</p>',
   'Node.js,TypeScript,SQLite,Commander', '', 'https://github.com/example/ink-cli', '', 2, 'published'),

  ('WanderLog 旅行足迹地图', 'wanderlog',
   '把照片里的 GPS 信息变成一张可回看的旅行地图，支持按年份筛选。',
   '<h2>功能概览</h2><p>导入照片后自动解析 EXIF 坐标，在地图上生成热力轨迹，点击标记可以看到当天的照片与文字记录。</p><h2>技术选择</h2><ul><li>前端 Vue 3 + MapLibre GL，矢量瓦片在移动端依旧流畅</li><li>图片解析放在 Web Worker，避免阻塞主线程</li><li>后端只做鉴权与元数据存储，原图留在用户自己的对象存储</li></ul><h2>后续计划</h2><p>增加「按同行人筛选」与轨迹导出 GPX。</p>',
   'Vue 3,MapLibre,Web Worker,Express,MySQL', '', 'https://github.com/example/wanderlog', 'https://wanderlog.example.com', 3, 'published'),

  ('DevSnap 代码片段管理器', 'devsnap',
   '草稿中的项目：面向个人的代码片段收藏与语义搜索。',
   '<p>目前只有设计稿，等 PulseBoard 稳定后继续。</p>',
   'Vue 3,Express,MySQL', '', '', '', 99, 'draft')
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `summary` = VALUES(`summary`),
  `description` = VALUES(`description`),
  `tech_stack` = VALUES(`tech_stack`),
  `repo_url` = VALUES(`repo_url`),
  `demo_url` = VALUES(`demo_url`),
  `sort_order` = VALUES(`sort_order`),
  `status` = VALUES(`status`);

-- -------------------------------------------------------------
-- 文章（5 条已发布 + 1 条草稿）
-- -------------------------------------------------------------
INSERT INTO `articles`
  (`title`, `slug`, `summary`, `content`, `cover_url`, `tags`, `status`, `view_count`, `published_at`)
VALUES
  ('用 Composition API 拆分一个真实页面', 'vue3-composition-api-in-practice',
   '从 400 行的 Options API 组件出发，一步步拆成可复用的 composable，并说明哪些逻辑不该被抽出去。',
   '<p>很多人第一次用 <code>setup</code>，会把它写成「把 data 改成 ref」的机械翻译。真正有价值的，是按<strong>关注点</strong>而不是按选项类型来组织代码。</p><h2>拆分前的样子</h2><p>一个文章列表页同时负责：请求列表、维护分页、处理加载态、同步 URL query、格式化时间。全部堆在一个文件里，改一处要读三遍。</p><h2>按关注点提取</h2><pre><code>// composables/usePagination.js
export function usePagination(fetcher, { pageSize = 10 } = {}) {
  const page = ref(1)
  const total = ref(0)
  const loading = ref(false)

  async function load() {
    loading.value = true
    try {
      const res = await fetcher({ page: page.value, pageSize })
      total.value = res.pagination.total
      return res.list
    } finally {
      loading.value = false
    }
  }

  return { page, total, loading, load }
}</code></pre><h2>不该抽出去的部分</h2><p>只被一个页面使用、且没有独立语义的逻辑，留在页面里更好读。抽象的收益来自复用与命名，而不是文件数量。</p><h2>小结</h2><p>先写能跑的代码，等第二次出现同类需求时再抽象——这个顺序比一开始就设计「完美架构」可靠得多。</p>',
   '', 'Vue 3,前端工程', 'published', 428, '2026-10-28 09:30:00'),

  ('MySQL 索引笔记：从一条慢查询说起', 'mysql-index-notes',
   '记录一次文章列表接口从 1.2s 优化到 30ms 的过程，以及联合索引最左前缀的实际影响。',
   '<p>博客文章表只有几万行，但列表接口偶尔要 1 秒以上。用 <code>EXPLAIN</code> 一看，问题很典型。</p><h2>问题现场</h2><pre><code>SELECT id, title, summary, published_at
FROM articles
WHERE status = ''published''
ORDER BY published_at DESC
LIMIT 0, 10;</code></pre><p>执行计划显示 <code>Using filesort</code>：先在 status 上过滤，再把结果整体排序。</p><h2>联合索引的解法</h2><p>把过滤条件和排序字段放进同一个索引，顺序是 <code>(status, published_at)</code>：</p><pre><code>ALTER TABLE articles
  ADD INDEX idx_articles_status_published (status, published_at);</code></pre><p>此时 <code>status</code> 是等值条件，<code>published_at</code> 天然有序，filesort 消失，扫描行数从数万降到 10 行。</p><h2>最左前缀的两个坑</h2><ul><li>索引 <code>(a, b)</code> 对 <code>WHERE b = ?</code> 基本无效</li><li><code>WHERE a = ? ORDER BY b</code> 能用上索引顺序；<code>WHERE a &gt; ? ORDER BY b</code> 就不一定了</li></ul><h2>结论</h2><p>索引不是越多越好：每个索引都会增加写入成本。先看真实查询，再决定加什么。</p>',
   '', 'MySQL,后端', 'published', 316, '2026-10-20 21:10:00'),

  ('Express 统一错误处理的三种常见写法', 'express-error-handling',
   '对比 try/catch 满天飞、async 包装器、错误优先中间件三种方案，给出 v1.0 采用的分层做法。',
   '<p>错误处理做得好不好，决定了线上出问题时你能不能五分钟定位。</p><h2>写法一：每个 handler 里 try/catch</h2><p>直观，但重复代码多，而且很容易忘记 <code>next(err)</code>，导致请求悬挂。</p><h2>写法二：async 包装器</h2><pre><code>const asyncHandler = (fn) => (req, res, next) =&gt;
  Promise.resolve(fn(req, res, next)).catch(next)</code></pre><p>业务代码只关心成功路径，异常统一交给错误中间件，这是本项目的选择。</p><h2>写法三：自定义错误类型 + 集中映射</h2><p>在包装器之上，再定义 <code>ApiError</code>，携带 HTTP 状态码与业务码。错误中间件负责：</p><ul><li>已知错误：按声明返回，不打印堆栈</li><li>未知错误：记录日志，生产环境只返回通用提示</li><li>数据库错误：转换为用户可读的信息，绝不透出 SQL</li></ul><h2>一个细节</h2><p>错误中间件必须声明四个参数 <code>(err, req, res, next)</code>，少一个 Express 就不会把它当成错误处理器。</p>',
   '', 'Node.js,Express,后端', 'published', 205, '2026-10-12 10:05:00'),

  ('前端 XSS 防护：v-html 不是原罪', 'frontend-xss-defense',
   '当文章内容允许简单 HTML 时，如何用白名单过滤 + 渲染约束把风险降到可接受范围。',
   '<p>只要使用 <code>v-html</code>，就一定不安全吗？不一定。风险来自「把不可信字符串当 HTML 插入」，而不是指令本身。</p><h2>威胁模型</h2><p>本项目的文章内容由站主通过 SQL 导入，属于半可信数据；但仍要防御两类情况：数据库被写入恶意内容、内容来自第三方转载。</p><h2>白名单过滤</h2><p>核心思路是「只保留认识的标签和属性」，而不是黑名单删 <code>script</code>：</p><pre><code>const ALLOWED_TAGS = new Set([
  ''P'', ''H2'', ''H3'', ''UL'', ''OL'', ''LI'', ''STRONG'',
  ''EM'', ''CODE'', ''PRE'', ''BLOCKQUOTE'', ''A'', ''BR''
])</code></pre><p>遍历 DOM 树，遇到不在白名单的节点直接解包或删除；<code>a</code> 标签只允许 <code>href</code>，且协议必须是 http/https。</p><h2>纵深防御</h2><ul><li>后端不返回未发布的草稿内容</li><li>前端渲染前统一过一遍 <code>sanitizeHtml</code></li><li>为站点配置 CSP，禁止内联脚本（生产环境）</li></ul><h2>不要做的事</h2><p>不要用正则替换来「清洗」HTML，解析歧义会带来绕过。用浏览器自带的 DOMParser 建立 DOM 树再按节点判断。</p>',
   '', '安全,前端', 'published', 512, '2026-09-30 08:45:00'),

  ('Monorepo 与 Git 工作流：一个人也能有序', 'monorepo-git-workflow',
   '前后端放在同一个仓库时，如何组织目录、写提交信息、用分支隔离风险。',
   '<p>个人项目最容易失控的地方不是代码，而是历史记录：三个月后回看，全是 <code>update</code> 和 <code>fix bug</code>。</p><h2>目录即边界</h2><p><code>frontend</code> 与 <code>backend</code> 各自独立安装依赖、独立启动，根目录只放文档与数据库脚本。这样任何一边都可以单独拆出去。</p><h2>提交信息模板</h2><ul><li><code>feat: 新增文章列表分页</code></li><li><code>fix: 修复详情页阅读数重复上报</code></li><li><code>docs: 补充数据库初始化步骤</code></li><li><code>chore: 升级 vite 到 5.x</code></li><li><code>refactor: 抽取 asyncHandler</code></li></ul><p>一条提交只做一件事，标题说清「做了什么」，正文说「为什么」。</p><h2>分支策略</h2><p><code>main</code> 始终可运行；<code>dev</code> 用于连续开发；单个功能用 <code>feat/xxx</code>，完成后合并回 <code>dev</code>，稳定后进 <code>main</code>。</p><h2>发布标记</h2><p>v1.0 完成时打 <code>git tag v1.0.0</code>，方便以后对比。</p>',
   '', 'Git,工程化', 'published', 189, '2026-09-18 19:20:00'),

  ('2027 技术学习计划（草稿）', 'roadmap-2027-draft',
   '还在整理中，暂不发布。',
   '<p>草稿内容，不应出现在任何公开接口中。</p>',
   '', '随笔', 'draft', 0, NULL)
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `summary` = VALUES(`summary`),
  `content` = VALUES(`content`),
  `tags` = VALUES(`tags`),
  `status` = VALUES(`status`),
  `view_count` = VALUES(`view_count`),
  `published_at` = VALUES(`published_at`);

-- -------------------------------------------------------------
-- 站点配置：个人简介、联系板块、社交链接
-- -------------------------------------------------------------
INSERT INTO `site_config` (`config_key`, `config_value`) VALUES
  ('site_title', 'Lin的小站'),
  ('site_description', '写代码，也写代码之外的事。'),
  ('profile_name', 'Elorin'),
  ('profile_role', 'AI全栈开发'),
  ('profile_bio', '学习中。喜欢把复杂交互拆成可预测的小块，也喜欢在周末骑车去没去过的街区。这里记录项目、踩坑和偶尔的胡思乱想。'),
  ('profile_avatar_url', 'https://api.dicebear.com/7.x/notionists/svg?seed=elorin'),
  ('profile_location', '中国 · 郑州'),
  ('contact_email', 'elorin634@gmail.com'),
  ('contact_wechat', 'elorin'),
  ('contact_note', '邮件通常 1-2 天内回复；技术问题欢迎附上复现步骤，沟通效率会高很多。'),
  ('social_github', 'https://github.com/elorin634-dev'),
  ('social_zhihu', 'https://www.zhihu.com/people/elorin634'),
  ('social_x', 'https://x.com/elorin634'),
  ('footer_text', '© 2026 Lin的小站 · 由 Vue 3 与 Express 驱动')
ON DUPLICATE KEY UPDATE
  `config_value` = VALUES(`config_value`);
