'use strict';

const express = require('express');
const healthRoutes = require('./health.routes');
const homeRoutes = require('./home.routes');
const projectRoutes = require('./project.routes');
const articleRoutes = require('./article.routes');
const contactRoutes = require('./contact.routes');

const router = express.Router();

/** API 元信息，方便排查当前部署的版本 */
router.get('/', (req, res) => {
  res.json({
    code: 0,
    message: 'ok',
    data: {
      name: 'personal-blog-api',
      version: 'v1',
      endpoints: [
        'GET /api/v1/health',
        'GET /api/v1/home',
        'GET /api/v1/projects',
        'GET /api/v1/projects/:slug',
        'GET /api/v1/articles?page=1&pageSize=10',
        'GET /api/v1/articles/:slug',
        'POST /api/v1/articles/:id/view',
        'GET /api/v1/contact',
      ],
      reservedEndpoints: [
        'GET /api/v1/articles/:id/comments',
        'POST /api/v1/articles/:id/comments',
        'POST /api/v1/messages',
      ],
    },
  });
});

router.use('/health', healthRoutes);
router.use('/home', homeRoutes);
router.use('/projects', projectRoutes);
router.use('/articles', articleRoutes);
router.use('/contact', contactRoutes);

// 预留接口（v1.0 不实现，设计见 docs/api.md）：
// router.use('/articles/:id/comments', commentRoutes)
// router.use('/messages', messageRoutes)

module.exports = router;
