<script setup>
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchArticles } from '@/api';
import { useAsyncData } from '@/composables/useAsyncData';
import PageIntro from '@/components/PageIntro.vue';
import ArticleRow from '@/components/ArticleRow.vue';
import PaginationBar from '@/components/PaginationBar.vue';
import StatusBlock from '@/components/StatusBlock.vue';

const PAGE_SIZE = 6;

const route = useRoute();
const router = useRouter();
const { data, loading, error, execute } = useAsyncData((page) =>
  fetchArticles({ page, pageSize: PAGE_SIZE })
);

// URL 是分页的唯一来源，刷新后仍停留在同一页
const currentPage = computed(() => {
  const value = Number(route.query.page);
  return Number.isInteger(value) && value > 0 ? value : 1;
});

watch(currentPage, (page) => execute(page), { immediate: true });

const articles = computed(() => data.value?.list || []);
const pagination = computed(() => data.value?.pagination || null);

function goToPage(page) {
  router.push({
    name: 'articles',
    query: page > 1 ? { page } : {},
  });
}
</script>

<template>
  <div class="container">
    <PageIntro
      eyebrow="Writing"
      title="文章"
      description="关于前端工程、后端实践与工具使用的记录。尽量写清「为什么」，而不只是「怎么做」。"
    >
      <span v-if="pagination">已发布 {{ pagination.total }} 篇</span>
    </PageIntro>

    <StatusBlock :loading="loading" :error="error" @retry="execute(currentPage)">
      <div v-if="articles.length">
        <div class="article-list">
          <ArticleRow
            v-for="(article, index) in articles"
            :key="article.id"
            :article="article"
            :index="(currentPage - 1) * PAGE_SIZE + index"
          />
        </div>

        <PaginationBar v-if="pagination" :pagination="pagination" @change="goToPage" />
      </div>

      <div v-else class="empty-state">
        <p class="empty-title">这一页暂时没有文章</p>
        <p class="empty-desc">可能页码超出了范围，回到第一页看看。</p>
        <button type="button" class="btn btn-ghost" @click="goToPage(1)">回到第一页</button>
      </div>
    </StatusBlock>
  </div>
</template>

<style scoped>
.article-list {
  border-top: 1px solid var(--line);
}

.empty-state {
  padding: 64px 0 48px;
  text-align: center;
}

.empty-title {
  margin: 0 0 10px;
  font-family: var(--font-display);
  font-size: 1.4rem;
  color: var(--ink);
}

.empty-desc {
  margin: 0 0 20px;
  color: var(--ink-muted);
  font-size: 0.92rem;
}
</style>
