<script setup>
import { computed } from 'vue';
import { formatCount, formatDate } from '@/utils/format';

const props = defineProps({
  article: { type: Object, required: true },
  index: { type: Number, default: 0 },
});

const order = computed(() => String(props.index + 1).padStart(2, '0'));
const visibleTags = computed(() => props.article.tags.slice(0, 2));
</script>

<template>
  <RouterLink :to="`/articles/${article.slug}`" class="article-row">
    <span class="row-index" aria-hidden="true">{{ order }}</span>

    <div class="row-body">
      <div class="row-meta">
        <time :datetime="article.publishedAt">{{ formatDate(article.publishedAt) }}</time>
        <template v-if="visibleTags.length">
          <span class="dot" aria-hidden="true">·</span>
          <span v-for="tag in visibleTags" :key="tag" class="row-tag">{{ tag }}</span>
        </template>
      </div>

      <h3 class="row-title">{{ article.title }}</h3>
      <p class="row-summary">{{ article.summary }}</p>
    </div>

    <div class="row-side">
      <span class="row-views">{{ formatCount(article.viewCount) }} 次阅读</span>
      <span class="row-arrow" aria-hidden="true">→</span>
    </div>
  </RouterLink>
</template>

<style scoped>
.article-row {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  gap: 20px;
  align-items: start;
  padding: 26px 18px 26px 6px;
  border-bottom: 1px solid var(--line);
  color: inherit;
  text-decoration: none;
  transition: background 0.2s ease, padding-left 0.2s ease;
}

.article-row:hover {
  background: var(--surface-soft);
  padding-left: 14px;
}

.row-index {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--ink-muted);
  padding-top: 4px;
}

.row-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: var(--ink-muted);
  font-size: 0.8rem;
  letter-spacing: 0.02em;
}

.dot {
  opacity: 0.6;
}

.row-tag {
  color: var(--accent);
}

.row-title {
  margin: 8px 0 6px;
  font-family: var(--font-display);
  font-size: clamp(1.15rem, 2vw, 1.4rem);
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.01em;
  color: var(--ink);
  transition: color 0.2s ease;
}

.article-row:hover .row-title {
  color: var(--accent);
}

.row-summary {
  margin: 0;
  max-width: 62ch;
  color: var(--ink-soft);
  font-size: 0.92rem;
  line-height: 1.75;
}

.row-side {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-top: 4px;
  color: var(--ink-muted);
  font-size: 0.78rem;
  white-space: nowrap;
}

.row-arrow {
  font-size: 1rem;
  transition: transform 0.2s ease;
}

.article-row:hover .row-arrow {
  transform: translateX(3px);
  color: var(--accent);
}

@media (max-width: 720px) {
  .article-row {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 22px 12px 22px 6px;
  }

  .row-index {
    display: none;
  }

  .row-side {
    justify-content: space-between;
    padding-top: 2px;
  }

  .row-views {
    font-size: 0.75rem;
  }
}
</style>
