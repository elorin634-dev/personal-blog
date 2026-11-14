# 个人博客（v1.2）

一个前后端分离的个人博客：主页展示简介与精选内容，项目与文章各自有列表和详情，联系页支持游客留言，文章详情页支持**匿名评论互动**。v1.2 在 v1.1 的留言能力上增加了无需登录的评论浏览与提交，评论默认 `approved` 并即时展示；仍不包含登录、鉴权与后台管理。

- 前端：Vue 3 + Vite + Vue Router + Axios + Pinia
- 后端：Node.js + Express + mysql2（`mysql2/promise`）
- 数据库：MySQL 8
- 仓库结构：monorepo（`frontend` / `backend` / `database` / `docs`）

---

## 1. 功能范围

| 板块 | v1.2 已实现 |
| --- | --- |
| 主页 `/` | 个人简介、社交链接、精选项目（3 个）、最新文章（5 篇）、统计、联系入口 |
| 项目 `/projects` | 已发布项目列表；`/projects/:slug` 展示详情、技术栈、仓库/演示链接 |
| 文章 `/articles` | 已发布文章分页列表；`/articles/:slug` 展示正文、标签、阅读数 |
| 评论 | 文章详情页展示已审核评论（分页）；游客可匿名提交，默认 `approved` 即时展示 |
| 联系 `/contact` | 展示邮箱、微信、坐标、社交链接；提供无需登录的留言表单 |
| 留言 | `POST /api/v1/messages` 写入 `messages`，默认 `status = 'pending'`，不提供前台列表与审核页面 |
| 其他 | 移动端响应式导航、404 页面、加载骨架、错误重试、深色模式跟随系统 |

**不在 v1.2 范围**：登录/注册/鉴权、后台管理、评论回复/嵌套、点赞、举报、删除、编辑、留言列表与审核界面、图片上传、富文本编辑器、RSS、全文搜索、Docker。

评论已实现“提交 + 公开列表”，`pending` / `rejected` 状态与 `parent_id` 字段为后续审核、楼中楼预留；留言仍保持入库待审核、不在前台展示。设计见 [docs/database.md](docs/database.md) 与 [docs/api.md](docs/api.md)。

---

## 2. 目录结构

```text
.
├── backend
│   ├── src
│   │   ├── config          # 环境变量、MySQL 连接池
│   │   ├── controllers     # 只处理请求/响应，不写 SQL
│   │   ├── middlewares     # 校验、404、统一错误、访问日志
│   │   ├── routes          # /api/v1 路由装配
│   │   ├── services        # 业务逻辑与 SQL（参数化）
│   │   ├── utils           # ApiError、响应封装、分页、序列化
│   │   ├── app.js          # Express 实例与中间件
│   │   └── server.js       # 启动、优雅退出
│   ├── .env.example
│   └── package.json
├── frontend
│   ├── public/favicon.svg
│   ├── src
│   │   ├── api             # Axios 实例与接口函数
│   │   ├── assets/styles   # 设计令牌与全局样式
│   │   ├── components      # 导航、页脚、卡片、分页、评论区、状态块
│   │   ├── composables     # useAsyncData
│   │   ├── layouts         # DefaultLayout
│   │   ├── router          # 路由与 404
│   │   ├── stores          # Pinia：站点信息
│   │   ├── utils           # 日期格式化、HTML 清洗
│   │   ├── views           # 7 个页面
│   │   ├── App.vue
│   │   └── main.js
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── database
│   ├── migrations
│   │   └── v1.2.0_comments_parent_id.sql  # 已有库升级用（幂等）
│   ├── schema.sql          # 建库建表（可重复执行，会清空数据）
│   └── seed.sql            # 种子数据（UPSERT，可重复执行）
├── docs
│   ├── api.md              # 已实现 + 预留接口
│   └── database.md         # 表结构、索引、扩展设计
├── .gitignore
└── README.md
```

---

## 3. 本地启动

### 3.1 前置条件

| 依赖 | 版本 | 验证命令 |
| --- | --- | --- |
| Node.js | ≥ 18.17（推荐 20/22） | `node -v` |
| npm | ≥ 9 | `npm -v` |
| MySQL | 8.0+ | `mysql --version` |

### 3.2 初始化数据库

```bash
# 在仓库根目录执行
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql

# 验证：应分别返回 3（已发布项目）与 5（已发布文章）
mysql -u root -p -e "USE personal_blog;
  SELECT COUNT(*) AS projects FROM projects WHERE status='published';
  SELECT COUNT(*) AS articles FROM articles WHERE status='published';"
```

> `schema.sql` 会 `DROP TABLE` 后重建，**会清空已有数据**，只用于本地开发。

#### 已有数据库升级（v1.0 / v1.1 → v1.2）

不需要重跑 `schema.sql`。执行一次迁移脚本，为 `comments` 增加预留字段 `parent_id` 与索引（脚本幂等，可重复执行）：

```bash
mysql -u root -p < database/migrations/v1.2.0_comments_parent_id.sql

# 验证：应看到 parent_id 字段
mysql -u root -p -e "USE personal_blog; SHOW COLUMNS FROM comments LIKE 'parent_id';"
```

本次迁移**不修改现有数据**，也不改变 `messages` 表的留言逻辑。全新安装直接执行上面的 `schema.sql` + `seed.sql` 即可，无需迁移。

> 未执行迁移时，`POST /articles/:id/comments` 会因缺少 `parent_id` 列而失败（500）。请先迁移，再重启 v1.2 后端。

### 3.3 启动后端

```bash
cd backend
cp .env.example .env       # Windows PowerShell: Copy-Item .env.example .env
# 编辑 .env，至少填写 DB_PASSWORD
npm install
npm run dev                # 或 npm start
```

启动成功后：

```bash
curl http://localhost:3000/api/v1/health
curl http://localhost:3000/api/v1/home
```

健康检查返回 `"db": "up"` 即表示数据库连接正常。

### 3.4 启动前端

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

打开 <http://localhost:5173>。

若 5173 被占用，Vite 会自动换端口，此时后端 CORS 需要同步放行新地址（或直接通过 Vite 代理访问，见下方说明）。

### 3.5 两种联调方式

1. **直连后端**（默认）：`VITE_API_BASE_URL=http://localhost:3000/api/v1`，依赖后端 CORS 放行 `http://localhost:5173`。
2. **走 Vite 代理**：把 `VITE_API_BASE_URL` 留空或删除，`vite.config.js` 已把 `/api` 代理到 `http://localhost:3000`，不产生跨域。

---

## 4. 环境变量

### 后端 `backend/.env`

| 变量 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- |
| `PORT` | 否 | 3000 | 监听端口 |
| `NODE_ENV` | 否 | development | `production` 时隐藏错误堆栈 |
| `DB_HOST` | 否 | 127.0.0.1 | MySQL 地址 |
| `DB_PORT` | 否 | 3306 | MySQL 端口 |
| `DB_USER` | 否 | root | 数据库用户（生产建议单独建只读/读写账号） |
| `DB_PASSWORD` | 是 | 空 | 数据库密码 |
| `DB_NAME` | 否 | personal_blog | 数据库名 |
| `DB_CONNECTION_LIMIT` | 否 | 10 | 连接池上限 |
| `CORS_ORIGIN` | 否 | http://localhost:5173 | 允许的前端来源，逗号分隔多个 |
| `TRUST_PROXY` | 否 | 0 | 部署在 Nginx 等代理后设为 `1`，用于获取真实 IP |
| `VIEW_RATE_WINDOW_MS` | 否 | 60000 | 阅读数接口限流窗口 |
| `VIEW_RATE_MAX` | 否 | 30 | 窗口内最大请求数 |
| `MESSAGE_RATE_WINDOW_MS` | 否 | 3600000 | 留言接口限流窗口（默认 1 小时） |
| `MESSAGE_RATE_MAX` | 否 | 3 | 窗口内最多留言条数 |
| `COMMENT_RATE_WINDOW_MS` | 否 | 600000 | 评论接口限流窗口（默认 10 分钟） |
| `COMMENT_RATE_MAX` | 否 | 5 | 窗口内最多评论条数 |

### 前端 `frontend/.env`

| 变量 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | 否 | `/api/v1` | 后端 API 地址，末尾不要带 `/` |
| `VITE_SITE_NAME` | 否 | Lin的小站 | 站点名兜底值（接口未返回时使用） |

> `.env` 已在 `.gitignore` 中忽略，仓库只提交 `.env.example`。

---

## 5. API 概览

统一前缀 `/api/v1`，统一响应 `{ code, message, data }`，`code = 0` 表示成功。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/health` | 健康检查（含数据库探测） |
| GET | `/home` | 主页聚合数据 |
| GET | `/projects` | 项目列表（仅已发布） |
| GET | `/projects/:slug` | 项目详情 |
| GET | `/articles?page=1&pageSize=10` | 文章分页列表（仅已发布） |
| GET | `/articles/:slug` | 文章详情 |
| POST | `/articles/:id/view` | 阅读次数 +1（原子更新） |
| GET | `/articles/:id/comments?page=1&pageSize=20` | 公开评论列表（仅 approved） |
| POST | `/articles/:id/comments` | 提交匿名评论（默认 approved，即时展示） |
| GET | `/contact` | 联系板块配置 |
| POST | `/messages` | 提交游客留言（限流 + 蜜罐，写入待审核） |

评论与留言的完整字段、错误码与校验规则见 **[docs/api.md](docs/api.md)**。管理端审核接口尚未实现。

---

## 6. Git 规范

### 6.1 提交信息

格式：`<type>: <简短描述>`

| type | 用途 | 示例 |
| --- | --- | --- |
| `feat` | 新功能 | `feat: 新增文章列表分页` |
| `fix` | 修复缺陷 | `fix: 修复详情页阅读数重复上报` |
| `docs` | 文档 | `docs: 补充数据库初始化步骤` |
| `chore` | 构建/配置/依赖 | `chore: 升级 vite 到 6.x` |
| `refactor` | 重构（不改变行为） | `refactor: 抽取 asyncHandler` |

建议：一条提交只做一件事；标题用祈使句、不超过 50 字；必要时应说明「为什么」，而不只是「改了什么」。

### 6.2 分支

- `main`：随时可运行的稳定分支，发布打 tag。
- `dev`：日常开发集成分支。
- `feat/xxx`、`fix/xxx`：单个功能或修复，完成后合回 `dev`，稳定后进 `main`。

```bash
git init
git branch -M main
git checkout -b dev
```

### 6.3 各阶段建议提交信息

按本项目的实施阶段，可依次提交：

```bash
git add .gitignore README.md docs
git commit -m "docs: 初始化项目说明与目录结构"

git add database
git commit -m "feat(db): 新增 v1.0 表结构与种子数据"

git add backend/package.json backend/.env.example backend/src/config backend/src/utils backend/src/middlewares backend/src/app.js backend/src/server.js
git commit -m "feat(backend): 搭建 Express 分层骨架与统一响应"

git add backend/src
git commit -m "feat(backend): 实现 v1.0 查询接口与阅读数自增"

git add frontend/package.json frontend/vite.config.js frontend/index.html frontend/public frontend/src/main.js frontend/src/App.vue frontend/src/assets frontend/src/layouts frontend/src/router frontend/src/stores
git commit -m "feat(frontend): 搭建 Vue 3 应用骨架与站点布局"

git add frontend/src
git commit -m "feat(frontend): 实现主页、项目、文章与联系页面"

git add .
git commit -m "docs: 补充 API、数据库与本地启动文档"
git tag v1.0.0

# v1.1 游客留言
git checkout -b feat/v1.1-guest-messages
git add backend/src
git commit -m "feat(backend): 新增游客留言接口与限流校验"
git add frontend/src
git commit -m "feat(frontend): 联系页接入留言表单"
git add README.md docs
git commit -m "docs: 更新 v1.1 留言功能说明"
git tag v1.1.0

# v1.2 匿名评论
git checkout -b feat/v1.2-article-comments
git add database backend/src
git commit -m "feat(comments): 新增评论读写接口与 parent_id 迁移"
git add frontend/src
git commit -m "feat(frontend): 文章详情页接入匿名评论"
git add README.md docs
git commit -m "docs: 更新 v1.2 评论功能说明"
git tag v1.2.0
```

---

## 7. 安全实现说明

| 风险 | 措施 |
| --- | --- |
| SQL 注入 | 全部查询走 `pool.execute(sql, params)` 参数化；唯一拼接的 `LIMIT` 值先收敛为 1–50 的整数；连接池关闭 `multipleStatements` |
| 输入校验 | `slug` 正则白名单、分页参数正整数校验、文章 id 校验；留言/评论的昵称、邮箱、内容长度与格式校验，越界 `pageSize` 直接拒绝 |
| 统一错误处理 | `ApiError` + 错误中间件；数据库错误映射为可读信息；生产环境不返回堆栈与 SQL |
| XSS | 正文以简单 HTML 存储，前端渲染前用 `utils/sanitize.js` 做**标签/属性白名单**清洗（DOMParser 建树，移除 `script`/`iframe`/事件属性，校验链接协议）；留言与评论按**纯文本**存储，前端用文本插值渲染，绝不使用 `v-html` |
| CORS | 仅放行 `CORS_ORIGIN` 配置的来源，生产禁止 `*` |
| 其他响应头 | `helmet` 提供 `nosniff`、`frameguard` 等基础头；关闭 `x-powered-by` |
| 请求体过大 | `express.json({ limit: '100kb' })` |
| 阅读数刷量 | 后端按 IP 限流 + 数据库原子自增 + 前端 24h 去重（非严格统计） |
| 留言刷屏 | 按 IP 限流（默认 3 条/小时）+ 隐藏蜜罐字段 + 入库 `pending` 人工审核 + 不提供公开列表接口（无 CSRF 风险，因为不涉及登录态操作） |
| 评论刷屏 | 评论即时公开，按 IP 限流（默认 5 条/10 分钟）+ 隐藏蜜罐字段；公开列表只查 `approved`，且只返回 `id/nickname/content/created_at` |
| 敏感配置 | `.env` 不入库，仅提交 `.env.example` |

**已知边界**：XSS 清洗在客户端执行，属于纵深防御。v1.2 的评论默认自动通过并立即公开，是「即时互动」与「内容安全」之间的取舍：目前依靠限流 + 蜜罐 + 500 字上限控制风险。若垃圾评论增多，把 `commentService.js` 的 `SUBMIT_STATUS` 改为 `'pending'` 并配合管理端审核即可，表结构无需改动。评论内容以纯文本存储，任何展示场景都必须使用文本插值或转义，不能直接拼 HTML。

---

## 8. 假设与后续计划

### 8.1 合理假设

1. **单作者博客**，无多用户、无登录、无后台；内容通过 SQL 导入维护。
2. 数据库名使用 `personal_blog`；脚本与 `.env.example` 保持一致。
3. 正文是「半可信」的简单 HTML（站主撰写或经审核转载），因此允许有限标签；不使用 Markdown 解析与富文本编辑器。
4. 标签与技术栈使用逗号分隔字符串，v1.2 不做按标签筛选。
5. 项目数量较少，`GET /projects` 一次性返回全部已发布项目，不分页。
6. `pageSize` 默认 10、上限 50；文章列表前端使用 6，评论列表默认 20。
7. 阅读数去重采用「同一浏览器 24 小时」，仅用于展示，不作为精确统计。
8. 图片只存 URL（`cover_url` / `avatar_url`），不做上传与裁剪。
9. 时间按服务器本地时区返回 `YYYY-MM-DD HH:mm:ss`；如需跨时区，后续统一改为 UTC + 前端格式化。
10. 部署形态为「静态前端 + Node 进程 + 独立 MySQL」，不使用 Docker。
11. 留言只需「能提交并入库」：不提供公开列表、不做邮件通知、不做后台审核页面；审核由站主直接操作数据库完成。
12. 留言昵称 2–30 字、内容 5–1000 字；邮箱选填但填写后必须格式合法，且不会对外展示。
13. 留言限流基于进程内存，重启后计数清零；单实例部署足够，多实例部署需改为 Redis 等共享存储。
14. 评论为「即时互动」：v1.2 提交即写入 `approved` 并立即展示；表默认值仍保留 `pending`（安全默认），后续开启审核只需调整 `commentService.js` 的 `SUBMIT_STATUS`。
15. 评论昵称 2–30 字、内容 1–500 字，邮箱选填；公开列表每页 20 条，按时间正序。
16. `comments.parent_id` 已预留但 v1.2 始终写入 `NULL`，不支持回复/嵌套。
17. 评论限流同样基于进程内存，默认每 IP 10 分钟 5 条。

### 8.2 后续计划

**v1.1 — 游客留言（已完成）**

- `POST /api/v1/messages`、联系页留言表单、`pending` 入库。
- IP 限流 + 蜜罐字段 + 字段级校验；不提供前台列表与审核页面。

**v1.2 — 匿名评论（已完成）**

- `GET/POST /articles/:id/comments`、文章详情页评论列表与表单。
- 提交即 `approved` 并即时展示；公开列表只返回非敏感字段。
- `parent_id` 预留；IP 限流 + 蜜罐 + 字段校验。

**v1.3 — 审核与互动扩展**

- 管理端审核界面（独立管理端 + 鉴权），支持把 `SUBMIT_STATUS` 切回 `pending`。
- 留言 `read/archived` 状态管理；评论 `rejected` 处理。
- 楼中楼回复（使用 `parent_id`）、点赞、举报；评论游标分页。

**v1.4 — 统计与内容组织**

- `article_views` 表做服务端阅读去重；热门文章排序。
- 标签聚合页 `/tags/:tag`；文章上一篇/下一篇。
- RSS、sitemap、Open Graph 元信息。

**v1.5 — 工程化**

- 后端单元/接口测试（Vitest + Supertest），前端组件测试。
- ESLint + Prettier + CI（lint / test / build）。
- 结构化日志（pino）、全局限流、请求 ID。
- 生产部署：Nginx 反代 + `try_files` 支持 history 路由、PM2、HTTPS、CSP。

**更远**

- 轻量管理后台（独立路由 + JWT），支持草稿预览、留言/评论审核与定时发布。
- 图片上传与对象存储。
- 全文搜索（MySQL FULLTEXT 或 Meilisearch）。

---

## 9. 验收清单

| # | 验收项 | 验证方式 | 预期 |
| --- | --- | --- | --- |
| 1 | 数据库可初始化 | 依次执行 `schema.sql`、`seed.sql` | 无报错，3 个已发布项目、5 篇已发布文章 |
| 2 | 后端可启动 | `npm run dev` | 日志显示 MySQL 已连接、监听 3000 |
| 3 | 健康检查 | `GET /api/v1/health` | `200`，`db: "up"` |
| 4 | 主页数据 | `GET /api/v1/home` | 含 profile、3 个项目、5 篇文章 |
| 5 | 草稿不泄露 | `GET /api/v1/projects/devsnap` | `404`，`code: 40400` |
| 6 | 文章分页 | `GET /api/v1/articles?page=1&pageSize=2` | `list` 长度 2，`total: 5` |
| 7 | 参数校验 | `GET /api/v1/articles?page=abc` | `400`，`code: 40000` |
| 8 | 阅读数 +1 | 连续 POST `/articles/1/view` | `viewCount` 递增 |
| 9 | 前端四板块 | 访问 `/`、`/projects`、`/articles`、`/contact` | 均正常渲染，导航高亮正确 |
| 10 | 详情页 | 点击任一项目/文章 | 内容、标签、元信息正确 |
| 11 | 阅读数联动 | 首次打开文章详情 | 阅读数 +1；24h 内刷新不再增加 |
| 12 | 联系页 | 访问 `/contact` | 显示邮箱、微信、社交链接与留言表单 |
| 13 | 404 | 访问 `/not-exist` 并刷新 | 404 页面正常，不白屏 |
| 14 | 移动端 | 375px 宽度 | 导航折叠为菜单，布局单列，表单不溢出 |
| 15 | Git | `git status` | 无 `node_modules`、`.env`、`dist` 被跟踪 |
| 16 | 不使用 Docker | 检查仓库 | 无 Dockerfile / compose |
| 17 | 留言提交 | 表单填写合法内容并提交 | `201`，提示已收到；`messages` 新增一行且 `status = 'pending'` |
| 18 | 留言校验 | 提交 1 字昵称 / 非法邮箱 / 4 字内容 | `400`，`code: 40000`，`data` 含对应字段错误 |
| 19 | 留言限流 | 同一 IP 连续提交超过 `MESSAGE_RATE_MAX` 条 | 超出后返回 `429`，`code: 42900` |
| 20 | 留言不公开 | 检查前台页面与接口清单 | 没有留言列表，也没有 `GET /messages` |
| 21 | 评论列表 | 访问任一文章详情页 | 展示 `approved` 评论，按时间正序，分页加载 |
| 22 | 提交评论 | 填写昵称与内容并提交 | `201`，评论立即出现在列表；库中 `status='approved'`、`parent_id=NULL` |
| 23 | 评论敏感字段 | 检查 `GET /articles/:id/comments` 响应 | 只有 `id/nickname/content/createdAt`，无 `email/ip/user_agent/status` |
| 24 | 评论校验 | 提交 1 字昵称 / 非法邮箱 / 空内容 / 501 字 | `400`，`code: 40000`，`data` 含字段错误 |
| 25 | 评论限流 | 同一 IP 连续提交超过 `COMMENT_RATE_MAX` 条 | 超出后 `429`，`code: 42900` |
| 26 | 评论与草稿隔离 | `GET /articles/6/comments`（草稿文章） | `404`，`code: 40400` |

---

## 10. 常见问题

**启动后端报 `数据库连接不可用` / `ECONNREFUSED`**

MySQL 未启动、端口不对，或 `.env` 中账号密码错误。先确认 `mysql -u root -p` 能登录，再核对 `DB_*`。

**`ER_ACCESS_DENIED_ERROR`**

`DB_USER` / `DB_PASSWORD` 不匹配。MySQL 8 默认认证插件为 `caching_sha2_password`，mysql2 已支持，无需改插件。

**前端报「无法连接后端服务」**

后端未启动，或 `VITE_API_BASE_URL` 写错（注意末尾不要带 `/`，也不要漏 `/api/v1`）。修改 `.env` 后需重启 `npm run dev`。

**浏览器控制台 CORS 报错**

前端实际访问的地址不在 `CORS_ORIGIN` 中。把该地址加入（逗号分隔），或改用 Vite 代理方式。

**留言提交后提示「留言太频繁了」**

触发了按 IP 限流（默认 3 条/小时）。等待窗口结束，或调整 `MESSAGE_RATE_MAX` / `MESSAGE_RATE_WINDOW_MS` 后重启后端；内存计数在重启后会清零。

**留言提交成功，但前台看不到**

这是留言功能的预期行为（v1.1 起）：留言只入库待审核，不提供前台列表。查看数据：

```bash
mysql -u root -p -e "USE personal_blog; SELECT id,name,email,status,created_at FROM messages ORDER BY id DESC LIMIT 10;"
```

**评论提交后提示「评论太频繁了」**

触发了按 IP 限流（默认 5 条/10 分钟）。等待窗口结束，或调整 `COMMENT_RATE_MAX` / `COMMENT_RATE_WINDOW_MS` 后重启后端。

**评论提交成功但列表里没有**

先确认没有触发限流；v1.2 提交即 `approved`，刷新页面应能看到。如果数据库中是 `pending`，检查 `backend/src/services/commentService.js` 的 `SUBMIT_STATUS` 是否被改过。

**已有数据库报 `Unknown column 'parent_id' in 'field list'`**

没有执行 v1.2 迁移。运行：

```bash
mysql -u root -p < database/migrations/v1.2.0_comments_parent_id.sql
```

**评论邮箱会公开吗**

不会。公开列表只查询 `id/nickname/content/created_at`，`email`、`ip`、`user_agent` 不会出现在接口响应或页面上。

**刷新 `/articles/xxx` 在生产环境 404**

前端使用 history 路由，Nginx 需要：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

**文章正文样式错乱**

正文允许的标签见 `frontend/src/utils/sanitize.js`；不在白名单的标签会被解包（保留文字、去掉标签）。

---

## 11. 许可

仅用于个人学习与作品展示。种子数据中的人名、邮箱、链接均为示例，请替换为你自己的信息。
