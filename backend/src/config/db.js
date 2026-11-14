'use strict';

const mysql = require('mysql2/promise');
const config = require('./env');

/**
 * 全局连接池：整个进程复用，避免每次请求都建连接
 */
const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  queueLimit: 0,
  charset: 'utf8mb4_0900_ai_ci',
  // 让 DATETIME 以字符串返回，避免服务端时区与 Node 时区不一致导致偏移
  dateStrings: true,
  // 关闭多语句，降低 SQL 注入被放大利用的风险
  multipleStatements: false,
});

/**
 * 执行参数化查询
 * @param {string} sql 含 ? 占位符的 SQL
 * @param {Array} params 参数数组，禁止把用户输入拼进 sql
 */
async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * 事务封装：service 层需要多条写语句时使用
 * @param {(conn: import('mysql2/promise').PoolConnection) => Promise<any>} handler
 */
async function withTransaction(handler) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await handler(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/** 健康检查用：能拿到连接即视为可用 */
async function ping() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
    return true;
  } finally {
    conn.release();
  }
}

async function closePool() {
  await pool.end();
}

module.exports = { pool, query, withTransaction, ping, closePool };
