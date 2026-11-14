<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { fetchArticle, increaseArticleView } from '@/api';
import { useAsyncData } from '@/composables/useAsyncData';
import { sanitizeHtml } from '@/utils/sanitize';
import { formatCount, formatDateLong } from '@/utils/format';
import StatusBlock from '@/components/StatusBlock.vue';
import CommentSection from '@/components/CommentSection.vue';

// 同一浏览器 24 小时内不重复计数，避免刷新页面把阅读数刷高
const VIEW_DEDUPE_TTL = 24 * 60 * 60 * 1000;

const route = useRoute();
const { data, loading, error, execute } = useAsyncData(fetchArticle);
const viewCount = ref(0);

watch(
  () => route.params.slug,
  (slug) => {
    if (slug) execute(slug);
  },
  { immediate: true }
);

watch(data, (article) => {
  if (!article) return;
  viewCount.value = article.viewCount;
  document.title = `${article.title} · 文章`;
  registerView(article);
});

const article = computed(() => data.value || {});
const safeContent = computed(() => sanitizeHtml(article.value.content));

function storageKey(id) {
  return `blog:viewed:${id}`;
}

function wasViewedRecently(id) {
  try {
    const lastViewedAt = Number(localStorage.getItem(storageKey(id)));
    return Number.isFinite(lastViewedAt) && Date.now() - lastViewedAt < VIEW_DEDUPE_TTL;
  } catch {
    // 隐私模式可能禁用 localStorage，此时退化为每次都计数
    return false;
  }
}

function markViewed(id) {
  try {
    localStorage.setItem(storageKey(id), String(Date.now()));
  } catch {
    // 写入失败不影响阅读
  }
}

async function registerView(current) {
  if (!current?.id || wasViewedRecently(current.id)) return;

  try {
    const result = await increaseArticleView(current.id);
    if (result?.viewCount != null) viewCount.value = result.viewCount;
    markViewed(current.id);
  } catch {
    // 阅读数是锦上添花，失败时静默处理，不打断阅读
  }
}
</script>

<template>
  <div class="container article-page">
    <RouterLink to="/articles" class="back-link">← 全部文章</RouterLink>

    <StatusBlock :loading="loading" :error="error" @retry="execute(route.params.slug)">
      <article v-if="data" class="article">
        <header class="article-header">
          <div class="meta-row">
            <time :datetime="article.publishedAt">{{ formatDateLong(article.publishedAt) }}</time>
            <span class="sep" aria-hidden="true">/</span>
            <span>{{ article.readingMinutes }} 分钟读完</span>
            <span class="sep" aria-hidden="true">/</span>
            <span>{{ formatCount(viewCount) }} 次阅读</span>
          </div>

          <h1>{{ article.title }}</h1>
          <p class="article-summary">{{ article.summary }}</p>

          <ul v-if="article.tags.length" class="chip-list" aria-label="文章标签">
            <li v-for="tag in article.tags" :key="tag" class="chip">{{ tag }}</li>
          </ul>
        </header>

        <!--
          内容来自数据库，已通过 sanitizeHtml 做白名单清洗（见 utils/sanitize.js）。
          v1.0 不使用富文本编辑器，正文为受控的简单 HTML。
        -->
        <div class="article-body prose" v-html="safeContent"></div>

        <footer class="article-footer">
          <p class="footer-note">如果这篇文章对你有帮助，欢迎把想法写给我。</p>
          <RouterLink to="/contact" class="btn btn-ghost">联系我 →</RouterLink>
        </footer>

        <!-- v1.2 匿名评论：列表 + 提交，全部为纯文本渲染 -->
        <CommentSection v-if="article.id" :article-id="article.id" />
      </article>
    </StatusBlock>
  </div>
</template>

<style scoped>
.article-page {
  padding-top: 40px;
}

.back-link {
  display: inline-block;
  margin-bottom: 40px;
  color: var(--ink-muted);
  text-decoration: none;
  font-size: 0.85rem;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: var(--accent);
}

.article {
  max-width: 760px;
  margin: 0 auto;
}

.article-header {
  padding-bottom: 36px;
  border-bottom: 1px solid var(--line);
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: var(--ink-muted);
  font-size: 0.8rem;
  letter-spacing: 0.02em;
}

.sep {
  opacity: 0.5;
}

h1 {
  margin: 20px 0 0;
  font-family: var(--font-display);
  font-size: clamp(2rem, 4.6vw, 3rem);
  font-weight: 600;
  line-height: 1.22;
  letter-spacing: -0.02em;
  color: var(--ink);
  text-wrap: balance;
}

.article-summary {
  margin: 18px 0 0;
  color: var(--ink-soft);
  font-size: 1rem;
  line-height: 1.85;
}

.chip-list {
  margin-top: 24px;
}

.article-body {
  padding: 40px 0 8px;
}

.article-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 40px;
  padding-top: 28px;
  border-top: 1px solid var(--line);
}

.footer-note {
  margin: 0;
  color: var(--ink-muted);
  font-size: 0.88rem;
}

@media (max-width: 720px) {
  .article-page {
    padding-top: 24px;
  }

  .back-link {
    margin-bottom: 28px;
  }
}
</style>
