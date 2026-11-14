# API 设计（v1.1）

- **Base URL**：`http://localhost:3000/api/v1`
- **数据格式**：`application/json; charset=utf-8`
- **鉴权**：v1.1 无登录、无鉴权。公开接口以只读为主，写入接口仅有阅读数 +1 与游客留言
- **版本策略**：URL 前缀携带版本号。未来出现不兼容变更时新增 `/api/v2`，v1 保持至少一个版本的兼容期。

> v1.1 变更：新增已实现的 `POST /api/v1/messages`（游客留言入库，不公开读取）；文章评论接口保持预留。

---

## 1. 通用约定

### 1.1 统一响应格式

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `code` | number | `0` 表示成功；非 0 为业务错误码 |
| `message` | string | 可直接展示给用户的提示 |
| `data` | any | 成功时为业务数据；失败时通常为 `null`，参数错误时可能包含细节 |

### 1.2 业务错误码

| code | HTTP | 含义 |
| --- | --- | --- |
| `0` | 200 | 成功 |
| `40000` | 400 | 参数校验失败 |
| `40300` | 403 | 跨域来源不被允许 |
| `40400` | 404 | 资源不存在 / 未发布 |
| `41300` | 413 | 请求体过大（超过 100kb） |
| `42900` | 429 | 触发限流 |
| `50000` | 500 | 服务器内部错误 |
| `50300` | 503 | 依赖不可用（数据库断开） |

错误示例：

```json
{
  "code": 40400,
  "message": "文章不存在或未发布",
  "data": null
}
```

### 1.3 时间与分页

- 时间统一返回 `YYYY-MM-DD HH:mm:ss`（服务器本地时区，MySQL 原样返回）。
- 分页参数：`page` 从 1 开始，`pageSize` 默认 10、上限 50；非正整数返回 `40000`。
- 分页响应的 `data` 结构：

```json
{
  "list": [],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 23,
    "totalPages": 3
  }
}
```

### 1.4 跨域与限流

- CORS 仅放行 `CORS_ORIGIN` 中配置的来源（逗号分隔多个）。
- `POST /articles/:id/view` 按 IP 限流，默认 60 秒 30 次（`VIEW_RATE_WINDOW_MS` / `VIEW_RATE_MAX`）。
- `POST /messages` 按 IP 限流，默认 1 小时 3 次（`MESSAGE_RATE_WINDOW_MS` / `MESSAGE_RATE_MAX`）；计数存于进程内存，重启清零。

---

## 2. v1.1 已实现接口

### 2.1 健康检查

```
GET /api/v1/health
```

成功（200）：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "status": "ok",
    "db": "up",
    "dbLatencyMs": 3,
    "uptimeSeconds": 128,
    "env": "development",
    "timestamp": "2026-11-14T08:45:16.061Z"
  }
}
```

数据库不可用时返回 `503` + `code: 50300`，`data.status = "degraded"`。

---

### 2.2 主页聚合

```
GET /api/v1/home
```

一次性返回首屏数据，减少请求数。

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "site": {
      "title": "林间小站",
      "description": "写代码，也写代码之外的事。"
    },
    "profile": {
      "name": "林知远",
      "role": "全栈开发 / 偏前端",
      "bio": "五年前端、两年 Node.js……",
      "avatarUrl": "https://api.dicebear.com/7.x/notionists/svg?seed=linzhiyuan",
      "location": "中国 · 杭州"
    },
    "contact": {
      "email": "hi@linzhiyuan.dev",
      "wechat": "linzy_dev",
      "note": "邮件通常 1-2 天内回复……"
    },
    "social": [
      { "platform": "github", "label": "GitHub", "url": "https://github.com/example" }
    ],
    "footerText": "© 2026 林间小站 · 由 Vue 3 与 Express 驱动",
    "featuredProjects": [
      {
        "id": 1,
        "title": "PulseBoard 实时监控面板",
        "slug": "pulseboard",
        "summary": "一个用于观察服务健康度的轻量实时面板……",
        "techStack": ["Vue 3", "Vite", "ECharts"],
        "coverUrl": "",
        "repoUrl": "https://github.com/example/pulseboard",
        "demoUrl": "https://pulseboard.example.com",
        "sortOrder": 1,
        "createdAt": "2026-11-14 16:00:00"
      }
    ],
    "latestArticles": [
      {
        "id": 1,
        "title": "用 Composition API 拆分一个真实页面",
        "slug": "vue3-composition-api-in-practice",
        "summary": "从 400 行的 Options API 组件出发……",
        "coverUrl": "",
        "tags": ["Vue 3", "前端工程"],
        "viewCount": 428,
        "publishedAt": "2026-10-28 09:30:00"
      }
    ],
    "stats": { "projectCount": 3, "articleCount": 5 }
  }
}
```

说明：`featuredProjects` 取 `sort_order` 最小的 3 个已发布项目；`latestArticles` 取最近 5 篇已发布文章，**不含正文**。

---

### 2.3 项目列表

```
GET /api/v1/projects
```

仅返回 `status = 'published'`，按 `sort_order ASC, id DESC` 排序。

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "PulseBoard 实时监控面板",
        "slug": "pulseboard",
        "summary": "一个用于观察服务健康度的轻量实时面板……",
        "techStack": ["Vue 3", "Vite", "ECharts", "Node.js", "SSE"],
        "coverUrl": "",
        "repoUrl": "https://github.com/example/pulseboard",
        "demoUrl": "https://pulseboard.example.com",
        "sortOrder": 1,
        "createdAt": "2026-11-14 16:00:00"
      }
    ],
    "total": 3
  }
}
```

列表项**不包含** `description`。

---

### 2.4 项目详情

```
GET /api/v1/projects/:slug
```

- `slug` 只允许小写字母、数字与连字符，格式非法返回 `40000`。
- 项目不存在或为草稿，一律返回 `40400`。
- 成功时 `data` 为单个项目对象，额外包含 `description` 字段。

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 1,
    "title": "PulseBoard 实时监控面板",
    "slug": "pulseboard",
    "summary": "一个用于观察服务健康度的轻量实时面板……",
    "description": "<h2>项目背景</h2><p>……</p>",
    "techStack": ["Vue 3", "Vite", "ECharts", "Node.js", "SSE"],
    "coverUrl": "",
    "repoUrl": "https://github.com/example/pulseboard",
    "demoUrl": "https://pulseboard.example.com",
    "sortOrder": 1,
    "createdAt": "2026-11-14 16:00:00"
  }
}
```

> 前端使用 `v-html` 渲染 `description` / `content`，渲染前会经过 `utils/sanitize.js` 的白名单清洗。

---

### 2.5 文章列表

```
GET /api/v1/articles?page=1&pageSize=6
```

仅返回已发布文章，按 `published_at DESC, id DESC` 排序，不含正文。

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "用 Composition API 拆分一个真实页面",
        "slug": "vue3-composition-api-in-practice",
        "summary": "从 400 行的 Options API 组件出发……",
        "coverUrl": "",
        "tags": ["Vue 3", "前端工程"],
        "viewCount": 428,
        "publishedAt": "2026-10-28 09:30:00"
      }
    ],
    "pagination": { "page": 1, "pageSize": 6, "total": 5, "totalPages": 1 }
  }
}
```

---

### 2.6 文章详情

```
GET /api/v1/articles/:slug
```

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 1,
    "title": "用 Composition API 拆分一个真实页面",
    "slug": "vue3-composition-api-in-practice",
    "summary": "从 400 行的 Options API 组件出发……",
    "coverUrl": "",
    "tags": ["Vue 3", "前端工程"],
    "viewCount": 428,
    "publishedAt": "2026-10-28 09:30:00",
    "content": "<p>很多人第一次用 <code>setup</code>……</p>",
    "readingMinutes": 2,
    "updatedAt": "2026-11-14 16:00:00"
  }
}
```

`readingMinutes` 为服务端按正文字数估算（约 300 字/分钟，最少 1 分钟），避免前端重复计算。

---

### 2.7 阅读次数 +1

```
POST /api/v1/articles/:id/view
```

- 无请求体。
- 使用 `UPDATE articles SET view_count = view_count + 1 WHERE id = ? AND status = 'published'`，由数据库保证原子性。
- 成功返回最新阅读数；文章不存在或未发布返回 `40400`；超过限流返回 `42900`。

```json
{
  "code": 0,
  "message": "阅读次数已更新",
  "data": { "id": 1, "viewCount": 429 }
}
```

前端策略：文章详情加载成功后调用，同一浏览器 24 小时内同一篇文章只上报一次（localStorage 记录时间戳）。这是「防误刷」而非严格统计，真实 PV 统计应在后续接入服务端去重（见 §4.1）。

---

### 2.8 联系板块

```
GET /api/v1/contact
```

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "site": { "title": "林间小站", "description": "写代码，也写代码之外的事。" },
    "profile": {
      "name": "林知远",
      "role": "全栈开发 / 偏前端",
      "bio": "五年前端、两年 Node.js……",
      "avatarUrl": "https://api.dicebear.com/7.x/notionists/svg?seed=linzhiyuan",
      "location": "中国 · 杭州"
    },
    "contact": {
      "email": "hi@linzhiyuan.dev",
      "wechat": "linzy_dev",
      "note": "邮件通常 1-2 天内回复……"
    },
    "social": [
      { "platform": "github", "label": "GitHub", "url": "https://github.com/example" },
      { "platform": "zhihu", "label": "知乎", "url": "https://www.zhihu.com/people/example" }
    ],
    "footerText": "© 2026 林间小站 · 由 Vue 3 与 Express 驱动"
  }
}
```

配置项全部来自 `site_config` 表，新增社交链接只需插入一行 `social_xxx`，无需改代码（展示名可在 `configService.js` 的 `SOCIAL_LABELS` 中补充）。

---

### 2.9 提交游客留言

```
POST /api/v1/messages
Content-Type: application/json
```

无登录、无鉴权。留言写入 `messages` 表，`status` 固定为 `pending`，等待站主审核；**不提供任何公开读取接口**。

**请求体**

| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| `name` | string | 是 | 去掉首尾空白、压缩连续空白后 2–30 个字符 |
| `email` | string | 否 | 合法邮箱，≤190 字符；统一转小写；仅站主可见 |
| `content` | string | 是 | 去掉首尾空白后 5–1000 个字符，保留换行，按纯文本存储 |
| `website` | string | 否 | 蜜罐字段。正常用户不填写；有值视为机器人，返回成功但**不入库** |

```json
{
  "name": "路过的访客",
  "email": "guest@example.com",
  "content": "你好，想请教一下文章里的索引设计。"
}
```

**成功响应（201）**

```json
{
  "code": 0,
  "message": "留言已收到，审核后会尽快回复",
  "data": { "id": 12, "status": "pending" }
}
```

说明：

- 响应**不回显**留言内容，降低被当作反射型 XSS 载体的可能。
- 命中蜜罐时同样返回 `201`，但 `data` 只有 `{ "status": "pending" }`，不会产生数据库记录。
- `content` 按纯文本原样存储；未来做展示或后台时必须在输出端转义，不能直接拼 HTML。

**错误**

| 场景 | HTTP | code | data |
| --- | --- | --- | --- |
| 字段缺失 / 长度不符 / 邮箱非法 | 400 | `40000` | 字段级错误，如 `{ "content": "留言内容至少 5 个字符" }` |
| 请求体不是合法 JSON | 400 | `40000` | `null` |
| 请求体超过 100kb | 413 | `41300` | `null` |
| 同一 IP 超过限流阈值 | 429 | `42900` | `null`，响应头带 `Retry-After` |
| 数据库不可用 | 503 | `50300` | `null` |

字段级错误示例：

```json
{
  "code": 40000,
  "message": "请检查填写内容",
  "data": {
    "name": "昵称需为 2-30 个字符",
    "email": "邮箱格式不正确"
  }
}
```

---

### 2.10 API 元信息

```
GET /api/v1
```

返回当前版本、应用版本与端点清单，便于确认部署版本。

---

## 3. 预留接口设计（v1.1 不实现）

以下接口在 v1.1 **未挂载路由**，仅完成数据库表与文档设计。上线前需要补充：输入校验、限流、审核策略、隐私处理。

### 3.1 获取文章评论

```
GET /api/v1/articles/:id/comments?page=1&pageSize=20
```

**规则**

- 仅返回 `status = 'approved'` 的评论，按 `created_at ASC` 排序（楼层顺序）。
- `id` 必须是已发布文章，否则 `40400`。
- **绝不返回** `email`、`ip`、`user_agent`。
- `nickname` 在输出时做 HTML 转义；`content` 作为纯文本返回，前端用插值而非 `v-html`。

**响应**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": 12,
        "nickname": "路过的前端",
        "content": "这个拆分思路很实用，准备照着改一版。",
        "createdAt": "2026-11-01 10:22:00"
      }
    ],
    "pagination": { "page": 1, "pageSize": 20, "total": 1, "totalPages": 1 }
  }
}
```

### 3.2 提交游客评论

```
POST /api/v1/articles/:id/comments
Content-Type: application/json
```

**请求体**

| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| `nickname` | string | 是 | 2–30 字符，去首尾空格，禁止纯空白 |
| `email` | string | 否 | 合法邮箱，≤190 字符；仅站主可见 |
| `content` | string | 是 | 1–500 字符，纯文本，后端做 HTML 转义 |
| `website` | string | 否 | 蜜罐字段：非空则视为机器人，直接返回 201 但不入库 |

**服务端处理**

1. 校验文章存在且已发布。
2. 限流：同一 IP 每小时最多 5 条（后续可换 Redis 计数）。
3. `status` 固定写入 `pending`，需站主审核后才可展示。
4. 记录 `ip`（取 `req.ip`，部署在代理后需设置 `TRUST_PROXY=1`）与截断到 500 字符的 `user_agent`。
5. 内容按纯文本存储，**不做** Markdown 解析。

**响应（201）**

```json
{
  "code": 0,
  "message": "评论已提交，审核通过后展示",
  "data": { "id": 13, "status": "pending" }
}
```

**错误**

| 场景 | code | HTTP |
| --- | --- | --- |
| 字段缺失/超长/邮箱非法 | `40000` | 400 |
| 文章不存在 | `40400` | 404 |
| 频率超限 | `42900` | 429 |

### 3.3 审核接口（更后续）

后台管理不在 v1.1 范围内。留言目前只能由站主直接操作数据库处理：

```sql
UPDATE messages SET status = 'read' WHERE id = ?;      -- 已读
UPDATE messages SET status = 'archived' WHERE id = ?;  -- 归档
```

若后续要做管理端，建议：

- 独立的管理端路由 `/api/v1/admin/*`，使用 JWT + 角色校验。
- `PATCH /api/v1/admin/comments/:id`，body `{ "status": "approved" | "rejected" }`。
- `PATCH /api/v1/admin/messages/:id`，body `{ "status": "read" | "archived" }`。
- 管理端与公开端分离部署，管理端不开放 CORS 给公网来源。

---

## 4. 后续扩展点

### 4.1 阅读次数

当前实现是「数据库原子自增 + 前端 localStorage 去重 + 后端 IP 限流」。若需要更准确的统计：

1. **服务端去重**：新增 `article_views(article_id, visitor_hash, viewed_on)` 表，`UNIQUE(article_id, visitor_hash, viewed_on)`；`visitor_hash = sha256(ip + ua + 每日盐)`，插入成功才自增。
2. **异步化**：高并发时改为写消息队列/Redis，定时批量回写 `articles.view_count`。
3. **热度排序**：基于 `view_count` 与发布时间做加权，新增 `GET /articles?sort=hot`。

### 4.2 评论

- 分页改游标（`before_id`）以适应长列表。
- 增加 `parent_id` 支持楼中楼；增加 `like_count`。
- 反垃圾：蜜罐字段 + 频率限制 + 关键词过滤 + 人工审核。

### 4.3 留言

v1.1 已完成写入链路，后续可扩展：

- **审核/查看**：管理端 `GET /api/v1/admin/messages?status=pending`（需鉴权），不在公开端提供留言列表。
- **通知**：新留言入库后异步发邮件提醒站主（nodemailer / 队列），失败不影响提交结果。
- **反垃圾**：当前为 IP 限流 + 蜜罐 + 人工审核；垃圾量上升后再加关键词过滤或第三方风控，谨慎引入验证码影响体验。
- **隐私与留存**：`ip` / `user_agent` 仅用于风控，建议保留 90 天后清空；`email` 永不公开，导出时脱敏。
- **状态流转**：`pending → read → archived`；如需回复，走邮件而非站内信。

### 4.4 兼容性

- 新增字段一律「只加不改」，前端忽略未知字段。
- 删除/重命名字段必须升级到 `/api/v2`。
