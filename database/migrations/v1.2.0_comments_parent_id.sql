-- =============================================================
-- v1.2.0 迁移：comments 表增加 parent_id（为后续楼中楼预留）
--
-- 适用：已经执行过 v1.0 / v1.1 schema.sql 的数据库
-- 全新安装：直接执行最新的 schema.sql 即可，无需本脚本
--
-- 执行：mysql -u root -p < database/migrations/v1.2.0_comments_parent_id.sql
-- 脚本可重复执行：列或索引已存在时跳过
-- =============================================================

USE `personal_blog`;

SET NAMES utf8mb4;

SET @schema_name := DATABASE();

-- 1. 增加 parent_id（幂等）
SET @has_column := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'comments'
    AND COLUMN_NAME = 'parent_id'
);

SET @ddl := IF(
  @has_column = 0,
  'ALTER TABLE `comments` ADD COLUMN `parent_id` INT UNSIGNED NULL DEFAULT NULL COMMENT ''父评论 id（预留，v1.2 不启用）'' AFTER `article_id`',
  'SELECT ''parent_id 已存在，跳过'' AS migration_note'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. 增加 parent_id 索引（幂等）
SET @has_index := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'comments'
    AND INDEX_NAME = 'idx_comments_parent'
);

SET @ddl := IF(
  @has_index = 0,
  'ALTER TABLE `comments` ADD KEY `idx_comments_parent` (`parent_id`)',
  'SELECT ''idx_comments_parent 已存在，跳过'' AS migration_note'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. 结果确认
SELECT
  COUNT(*) AS parent_id_columns
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @schema_name
  AND TABLE_NAME = 'comments'
  AND COLUMN_NAME = 'parent_id';
