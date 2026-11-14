-- =============================================================
-- 个人博客 v1.0 数据库结构
-- MySQL 8.0+ / utf8mb4
-- 使用方法：mysql -u root -p < database/schema.sql
-- =============================================================

CREATE DATABASE IF NOT EXISTS `personal_blog`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE `personal_blog`;

SET NAMES utf8mb4;

-- 按依赖倒序删除，方便反复执行本脚本（仅用于本地开发）
DROP TABLE IF EXISTS `comments`;
DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `site_config`;
DROP TABLE IF EXISTS `articles`;
DROP TABLE IF EXISTS `projects`;

-- -------------------------------------------------------------
-- 1. projects 项目表
-- -------------------------------------------------------------
CREATE TABLE `projects` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `title`       VARCHAR(120)  NOT NULL                COMMENT '项目名称',
  `slug`        VARCHAR(140)  NOT NULL                COMMENT 'URL 友好标识',
  `summary`     VARCHAR(300)  NOT NULL DEFAULT ''     COMMENT '一句话简介',
  `description` MEDIUMTEXT                            COMMENT '项目详细描述（纯文本或简单 HTML）',
  `tech_stack`  VARCHAR(255)  NOT NULL DEFAULT ''     COMMENT '技术栈，英文逗号分隔',
  `cover_url`   VARCHAR(500)  NOT NULL DEFAULT ''     COMMENT '封面图地址',
  `repo_url`    VARCHAR(500)  NOT NULL DEFAULT ''     COMMENT '代码仓库地址',
  `demo_url`    VARCHAR(500)  NOT NULL DEFAULT ''     COMMENT '在线演示地址',
  `sort_order`  INT           NOT NULL DEFAULT 0      COMMENT '排序，越小越靠前',
  `status`      ENUM('published','draft') NOT NULL DEFAULT 'draft' COMMENT '发布状态',
  `created_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_projects_slug` (`slug`),
  KEY `idx_projects_status_sort` (`status`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='项目展示';

-- -------------------------------------------------------------
-- 2. articles 文章表
-- -------------------------------------------------------------
CREATE TABLE `articles` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `title`        VARCHAR(200)  NOT NULL                COMMENT '标题',
  `slug`         VARCHAR(220)  NOT NULL                COMMENT 'URL 友好标识',
  `summary`      VARCHAR(400)  NOT NULL DEFAULT ''     COMMENT '摘要',
  `content`      LONGTEXT                              COMMENT '正文（简单 HTML）',
  `cover_url`    VARCHAR(500)  NOT NULL DEFAULT ''     COMMENT '封面图地址',
  `tags`         VARCHAR(255)  NOT NULL DEFAULT ''     COMMENT '标签，英文逗号分隔',
  `status`       ENUM('published','draft') NOT NULL DEFAULT 'draft' COMMENT '发布状态',
  -- view_count 为「阅读次数统计」预留：v1.0 只展示 + 提供 +1 接口
  `view_count`   INT UNSIGNED  NOT NULL DEFAULT 0      COMMENT '阅读次数',
  `published_at` DATETIME      NULL DEFAULT NULL       COMMENT '发布时间，NULL 表示未发布',
  `created_at`   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_articles_slug` (`slug`),
  -- 列表查询固定条件：status='published' ORDER BY published_at DESC
  KEY `idx_articles_status_published` (`status`, `published_at`),
  KEY `idx_articles_view_count` (`view_count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='文章';

-- -------------------------------------------------------------
-- 3. site_config 站点配置表（K/V）
--    联系板块、社交链接、个人简介均从这里读取
-- -------------------------------------------------------------
CREATE TABLE `site_config` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `config_key`   VARCHAR(100) NOT NULL COMMENT '配置键，如 contact_email',
  `config_value` TEXT         NOT NULL COMMENT '配置值',
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_site_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='站点配置';

-- -------------------------------------------------------------
-- 4. comments 游客评论表（v1.0 仅建表，不开放写入接口）
--    设计说明：无登录体系，status 为审核状态，默认 pending
-- -------------------------------------------------------------
CREATE TABLE `comments` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `article_id` INT UNSIGNED NOT NULL COMMENT '所属文章',
  `nickname`   VARCHAR(60)  NOT NULL              COMMENT '游客昵称',
  `email`      VARCHAR(190) NOT NULL DEFAULT ''   COMMENT '邮箱，仅站主可见，不公开展示',
  `content`    TEXT         NOT NULL              COMMENT '评论内容（纯文本）',
  `status`     ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending' COMMENT '审核状态',
  `ip`         VARCHAR(45)  NOT NULL DEFAULT ''   COMMENT '来源 IP（IPv6 最长 45）',
  `user_agent` VARCHAR(500) NOT NULL DEFAULT ''   COMMENT '浏览器 UA',
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_comments_article` (`article_id`),
  -- 详情页读取：某篇文章下已审核评论，按时间正序
  KEY `idx_comments_article_status_created` (`article_id`, `status`, `created_at`),
  CONSTRAINT `fk_comments_article`
    FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='游客评论（预留）';

-- -------------------------------------------------------------
-- 5. messages 游客留言表（v1.0 仅建表，不开放写入接口）
-- -------------------------------------------------------------
CREATE TABLE `messages` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(60)  NOT NULL              COMMENT '留言人称呼',
  `email`      VARCHAR(190) NOT NULL DEFAULT ''   COMMENT '联系邮箱',
  `content`    TEXT         NOT NULL              COMMENT '留言内容',
  `status`     ENUM('pending','read','archived') NOT NULL DEFAULT 'pending' COMMENT '处理状态',
  `ip`         VARCHAR(45)  NOT NULL DEFAULT '',
  `user_agent` VARCHAR(500) NOT NULL DEFAULT '',
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_messages_status_created` (`status`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='游客留言（预留）';
