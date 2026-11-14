'use strict';

const projectService = require('../services/projectService');
const { success } = require('../utils/response');

async function listProjects(req, res) {
  const data = await projectService.listPublished();
  return success(res, data);
}

async function getProject(req, res) {
  const project = await projectService.getBySlug(req.params.slug);
  return success(res, project);
}

module.exports = { listProjects, getProject };
