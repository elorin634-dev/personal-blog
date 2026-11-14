<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
  <div class="container not-found">
    <p class="code" aria-hidden="true">404</p>
    <p class="eyebrow">Page not found</p>
    <h1>这条路走到头了</h1>
    <p class="desc">
      <code>{{ route.fullPath }}</code> 这个地址不存在，可能是链接过期，或者我把它挪走了。
    </p>

    <div class="actions">
      <RouterLink to="/" class="btn btn-primary">回到主页</RouterLink>
      <RouterLink to="/articles" class="btn btn-ghost">去读文章</RouterLink>
    </div>

    <nav class="quick-links" aria-label="常用页面">
      <RouterLink to="/projects">项目</RouterLink>
      <RouterLink to="/articles">文章</RouterLink>
      <RouterLink to="/contact">联系</RouterLink>
    </nav>
  </div>
</template>

<style scoped>
.not-found {
  max-width: 640px;
  padding: 112px 0 72px;
}

.code {
  margin: 0 0 8px;
  font-family: var(--font-display);
  font-size: clamp(5rem, 16vw, 9rem);
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--line);
}

.eyebrow {
  margin: 0 0 14px;
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
}

h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.9rem, 4.5vw, 2.6rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--ink);
}

.desc {
  margin: 18px 0 0;
  color: var(--ink-soft);
  font-size: 0.95rem;
  line-height: 1.85;
}

.desc code {
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--surface-soft);
  font-family: var(--font-mono);
  font-size: 0.85em;
  overflow-wrap: anywhere;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 32px;
}

.quick-links {
  display: flex;
  gap: 20px;
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--line);
}

.quick-links a {
  color: var(--ink-muted);
  text-decoration: none;
  font-size: 0.85rem;
}

.quick-links a:hover {
  color: var(--accent);
}

@media (max-width: 720px) {
  .not-found {
    padding: 72px 0 48px;
  }
}
</style>
