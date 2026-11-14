<script setup>
import { computed } from 'vue';
import { useSiteStore } from '@/stores/site';

const store = useSiteStore();

const footerLinks = computed(() => [
  { to: '/projects', label: '项目' },
  { to: '/articles', label: '文章' },
  { to: '/contact', label: '联系' },
]);

const copyright = computed(() => {
  if (store.footerText) return store.footerText;
  return `© ${new Date().getFullYear()} ${store.siteTitle}`;
});
</script>

<template>
  <footer class="site-footer">
    <div class="container footer-grid">
      <div class="footer-brand">
        <p class="footer-name">{{ store.ownerName || store.siteTitle }}</p>
        <p class="footer-desc">{{ store.site.description || '记录项目、文章与一些想法。' }}</p>
      </div>

      <nav class="footer-nav" aria-label="页脚导航">
        <RouterLink v-for="link in footerLinks" :key="link.to" :to="link.to">
          {{ link.label }}
        </RouterLink>
      </nav>

      <ul v-if="store.social.length" class="footer-social" aria-label="社交链接">
        <li v-for="item in store.social" :key="item.platform">
          <a :href="item.url" target="_blank" rel="noopener noreferrer">{{ item.label }}</a>
        </li>
      </ul>
    </div>

    <div class="container footer-bottom">
      <span>{{ copyright }}</span>
      <span class="footer-stack">Vue 3 · Express · MySQL</span>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: 96px;
  border-top: 1px solid var(--line);
  padding: 56px 0 32px;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 32px;
  padding-bottom: 40px;
}

.footer-name {
  margin: 0 0 8px;
  font-family: var(--font-display);
  font-size: 1.35rem;
  color: var(--ink);
}

.footer-desc {
  margin: 0;
  max-width: 30ch;
  color: var(--ink-muted);
  font-size: 0.92rem;
  line-height: 1.7;
}

.footer-nav,
.footer-social {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

.footer-nav a,
.footer-social a {
  color: var(--ink-soft);
  text-decoration: none;
  font-size: 0.92rem;
  transition: color 0.2s ease;
}

.footer-nav a:hover,
.footer-social a:hover {
  color: var(--accent);
}

.footer-social {
  list-style: none;
  margin: 0;
  padding: 0;
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding-top: 24px;
  border-top: 1px solid var(--line);
  color: var(--ink-muted);
  font-size: 0.82rem;
}

@media (max-width: 720px) {
  .site-footer {
    margin-top: 64px;
    padding-top: 40px;
  }

  .footer-grid {
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .footer-brand {
    grid-column: 1 / -1;
  }

  .footer-bottom {
    flex-direction: column;
    gap: 6px;
  }
}
</style>
