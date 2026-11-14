# 个人博客（v1.0）

一个前后端分离的个人博客：主页展示简介与精选内容，项目与文章各自有列表和详情，联系页读取站点配置。v1.0 只做「展示」，不包含登录、鉴权与后台管理。

- 前端：Vue 3 + Vite + Vue Router + Axios + Pinia
- 后端：Node.js + Express + mysql2（`mysql2/promise`）
- 数据库：MySQL 8
- 仓库结构：monorepo（`frontend` / `backend` / `database` / `docs`）

---

## 1. 功能范围

| 板块 | v1.0 已实现 |
| --- | --- |
| 主页 `/` | 个人简介、社交链接、精选项目（3 个）、最新文章（5 篇）、统计、联系入口 |
| 项目 `/projects` | 已发布项目列表；`/projects/:slug` 展示详情、技术栈、仓库/演示链接 |
| 文章 `/articles` | 已发布文章分页列表；`/articles/:slug` 展示正文、标签、阅读数 |
| 联系 `/contact` | 展示邮箱、微信、坐标、社交链接；留言板占位（未开放提交） |
| 其他 | 移动端响应式导航、404 页面、加载骨架、错误重试、深色模式跟随系统 |

**不在 v1.0 范围**：登录/注册、后台管理、评论提交、留言提交、图片上传、富文本编辑器、RSS、全文搜索、Docker。

评论、留言、阅读次数统计的**数据结构与接口设计已预留**，见 [docs/database.md](docs/database.md) 与 [docs/api.md](docs/api.md)。

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
│   │   ├── components      # 导航、页脚、卡片、分页、状态块
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

### 前端 `frontend/.env`

| 变量 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | 否 | `/api/v1` | 后端 API 地址，末尾不要带 `/` |
| `VITE_SITE_NAME` | 否 | 林间小站 | 站点名兜底值（接口未返回时使用） |

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
| GET | `/contact` | 联系板块配置 |

预留但未实现：`GET/POST /articles/:id/comments`、`POST /messages`。完整字段、错误码与预留接口的校验规则见 **[docs/api.md](docs/api.md)**。

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
```

---

## 7. 安全实现说明

| 风险 | 措施 |
| --- | --- |
| SQL 注入 | 全部查询走 `pool.execute(sql, params)` 参数化；唯一拼接的 `LIMIT` 值先收敛为 1–50 的整数；连接池关闭 `multipleStatements` |
| 输入校验 | `slug` 正则白名单、分页参数正整数校验、文章 id 校验；越界 `pageSize` 直接拒绝 |
| 统一错误处理 | `ApiError` + 错误中间件；数据库错误映射为可读信息；生产环境不返回堆栈与 SQL |
| XSS | 正文以简单 HTML 存储，前端渲染前用 `utils/sanitize.js` 做**标签/属性白名单**清洗（DOMParser 建树，移除 `script`/`iframe`/事件属性，校验链接协议）；后端不返回草稿 |
| CORS | 仅放行 `CORS_ORIGIN` 配置的来源，生产禁止 `*` |
| 其他响应头 | `helmet` 提供 `nosniff`、`frameguard` 等基础头；关闭 `x-powered-by` |
| 请求体过大 | `express.json({ limit: '100kb' })` |
| 阅读数刷量 | 后端按 IP 限流 + 数据库原子自增 + 前端 24h 去重（非严格统计） |
| 敏感配置 | `.env` 不入库，仅提交 `.env.example` |

**已知边界**：XSS 清洗在客户端执行，属于纵深防御；v1.0 没有写入接口，因此风险面很小。后续开放评论/留言时，服务端必须按纯文本处理并在入库前清洗，不能只依赖前端。

---

## 8. 假设与后续计划

### 8.1 合理假设

1. **单作者博客**，无多用户、无登录、无后台；内容通过 SQL 导入维护。
2. 数据库名使用 `personal_blog`；脚本与 `.env.example` 保持一致。
3. 正文是「半可信」的简单 HTML（站主撰写或经审核转载），因此允许有限标签；不使用 Markdown 解析与富文本编辑器。
4. 标签与技术栈使用逗号分隔字符串，v1.0 不做按标签筛选。
5. 项目数量较少，`GET /projects` 一次性返回全部已发布项目，不分页。
6. `pageSize` 默认 10、上限 50；文章列表前端使用 6。
7. 阅读数去重采用「同一浏览器 24 小时」，仅用于展示，不作为精确统计。
8. 图片只存 URL（`cover_url` / `avatar_url`），不做上传与裁剪。
9. 时间按服务器本地时区返回 `YYYY-MM-DD HH:mm:ss`；如需跨时区，后续统一改为 UTC + 前端格式化。
10. 部署形态为「静态前端 + Node 进程 + 独立 MySQL」，不使用 Docker。

### 8.2 后续计划

**v1.1 — 互动**

- 实现 `GET/POST /articles/:id/comments`、`POST /messages`。
- 评论审核（`pending → approved`）、IP 限流、蜜罐字段、纯文本入库。
- 联系页开放留言表单。

**v1.2 — 统计与内容组织**

- `article_views` 表做服务端阅读去重；热门文章排序。
- 标签聚合页 `/tags/:tag`；文章上一篇/下一篇。
- RSS、sitemap、Open Graph 元信息。

**v1.3 — 工程化**

- 后端单元/接口测试（Vitest + Supertest），前端组件测试。
- ESLint + Prettier + CI（lint / test / build）。
- 结构化日志（pino）、全局限流、请求 ID。
- 生产部署：Nginx 反代 + `try_files` 支持 history 路由、PM2、HTTPS、CSP。

**更远**

- 轻量管理后台（独立路由 + JWT），支持草稿预览与定时发布。
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
| 12 | 联系页 | 访问 `/contact` | 显示邮箱、微信、社交链接 |
| 13 | 404 | 访问 `/not-exist` 并刷新 | 404 页面正常，不白屏 |
| 14 | 移动端 | 375px 宽度 | 导航折叠为菜单，布局单列 |
| 15 | Git | `git status` | 无 `node_modules`、`.env`、`dist` 被跟踪 |
| 16 | 不使用 Docker | 检查仓库 | 无 Dockerfile / compose |

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
