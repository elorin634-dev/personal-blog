import { defineStore } from 'pinia';
import { fetchContact } from '@/api';

// 模块级变量保存进行中的请求，避免 Header 与页面同时加载时重复发起
let pendingRequest = null;

const emptySite = { title: '', description: '' };
const emptyProfile = { name: '', role: '', bio: '', avatarUrl: '', location: '' };
const emptyContact = { email: '', wechat: '', note: '' };

/**
 * 站点级信息：头部品牌、页脚、联系页共用
 * 数据来自 /api/v1/contact（与主页聚合接口中的站点字段一致）
 */
export const useSiteStore = defineStore('site', {
  state: () => ({
    site: { ...emptySite },
    profile: { ...emptyProfile },
    contact: { ...emptyContact },
    social: [],
    footerText: '',
    loaded: false,
    loading: false,
    error: '',
  }),

  getters: {
    siteTitle: (state) => state.site.title || import.meta.env.VITE_SITE_NAME || '个人博客',
    ownerName: (state) => state.profile.name || '',
  },

  actions: {
    async load(force = false) {
      if (this.loaded && !force) return;
      if (pendingRequest) return pendingRequest;

      this.loading = true;
      this.error = '';

      pendingRequest = fetchContact()
        .then((data) => {
          this.site = data.site || { ...emptySite };
          this.profile = data.profile || { ...emptyProfile };
          this.contact = data.contact || { ...emptyContact };
          this.social = Array.isArray(data.social) ? data.social : [];
          this.footerText = data.footerText || '';
          this.loaded = true;
        })
        .catch((error) => {
          this.error = error.message || '站点信息加载失败';
        })
        .finally(() => {
          this.loading = false;
          pendingRequest = null;
        });

      return pendingRequest;
    },
  },
});
