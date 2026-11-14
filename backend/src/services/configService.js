'use strict';

const db = require('../config/db');

/**
 * site_config 采用 K/V 存储：新增联系方式或社交链接只需加一行数据，无需改表结构
 */

// 社交平台展示名，未登记的平台回退为 key 本身
const SOCIAL_LABELS = {
  social_github: 'GitHub',
  social_zhihu: '知乎',
  social_x: 'X',
  social_weibo: '微博',
  social_juejin: '掘金',
  social_bilibili: '哔哩哔哩',
  social_linkedin: 'LinkedIn',
};

function pick(map, key, fallback = '') {
  return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : fallback;
}

/**
 * 一次性取出全部配置，转成 { config_key: config_value }
 * 配置表只有几十行，直接全量读取比按 key 多次查询更省事
 */
async function getConfigMap() {
  const rows = await db.query('SELECT config_key, config_value FROM site_config ORDER BY id ASC');
  return rows.reduce((acc, row) => {
    acc[row.config_key] = row.config_value;
    return acc;
  }, {});
}

/** 站点信息 + 个人简介，主页与联系页共用 */
function buildSiteProfile(map) {
  const social = Object.keys(map)
    .filter((key) => key.startsWith('social_') && map[key])
    .map((key) => ({
      platform: key.replace('social_', ''),
      label: SOCIAL_LABELS[key] || key.replace('social_', ''),
      url: map[key],
    }));

  return {
    site: {
      title: pick(map, 'site_title', '个人博客'),
      description: pick(map, 'site_description'),
    },
    profile: {
      name: pick(map, 'profile_name'),
      role: pick(map, 'profile_role'),
      bio: pick(map, 'profile_bio'),
      avatarUrl: pick(map, 'profile_avatar_url'),
      location: pick(map, 'profile_location'),
    },
    contact: {
      email: pick(map, 'contact_email'),
      wechat: pick(map, 'contact_wechat'),
      note: pick(map, 'contact_note'),
    },
    social,
    footerText: pick(map, 'footer_text'),
  };
}

async function getSiteProfile() {
  return buildSiteProfile(await getConfigMap());
}

/** 联系板块：只返回展示所需字段 */
async function getContactInfo() {
  const { site, profile, contact, social, footerText } = await getSiteProfile();
  return { site, profile, contact, social, footerText };
}

module.exports = { getConfigMap, getSiteProfile, getContactInfo };
