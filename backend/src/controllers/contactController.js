'use strict';

const configService = require('../services/configService');
const { success } = require('../utils/response');

async function getContact(req, res) {
  const data = await configService.getContactInfo();
  return success(res, data);
}

module.exports = { getContact };
