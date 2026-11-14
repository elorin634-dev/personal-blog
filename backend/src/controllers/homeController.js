'use strict';

const homeService = require('../services/homeService');
const { success } = require('../utils/response');

async function getHome(req, res) {
  const data = await homeService.getHomeData();
  return success(res, data);
}

module.exports = { getHome };
