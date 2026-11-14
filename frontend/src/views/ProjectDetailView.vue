<script setup>
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { fetchProject } from '@/api';
import { useAsyncData } from '@/composables/useAsyncData';
import { sanitizeHtml } from '@/utils/sanitize';
import StatusBlock from '@/components/StatusBlock.vue';

const route = useRoute();
const { data, loading, error, execute } = useAsyncData(fetchProject);

watch(
  () => route.params.slug,
  (slug) => {
    if (slug) execute(slug);
  },
  { immediate: true }
);

watch(data, (project) => {
  if (project?.title) document.title = `${project.title} · 项目`;
});

const project = computed(() => data.value || {});
const safeDescription = computed(() => sanitizeHtml(project.value.description));
const hasLinks = computed(() => Boolean(project.value.repoUrl || project.value.demoUrl));

function formatYear(value) {
  return value ? String(value).slice(0, 4) : '';
}
</script>

<template>
  <div class="container detail-page">
    <RouterLink to="/projects" class="back-link">← 全部项目</RouterLink>

    <StatusBlock :loading="loading" :error="error" @retry="execute(route.params.slug)">
      <article v-if="data" class="detail">
        <header class="detail-header">
          <p class="eyebrow">Project</p>
          <h1>{{ project.title }}</h1>
          <p class="detail-summary">{{ project.summary }}</p>

          <ul v-if="project.techStack.length" class="chip-list" aria-label="技术栈">
            <li v-for="tech in project.techStack" :key="tech" class="chip">{{ tech }}</li>
          </ul>
        </header>

        <div class="detail-layout">
          <div class="prose" v-html="safeDescription"></div>

          <aside class="detail-aside">
            <dl class="meta-list">
              <div v-if="formatYear(project.createdAt)">
                <dt>年份</dt>
                <dd>{{ formatYear(project.createdAt) }}</dd>
              </div>
              <div v-if="project.techStack.length">
                <dt>技术栈</dt>
                <dd>{{ project.techStack.length }} 项</dd>
              </div>
            </dl>

            <div v-if="hasLinks" class="aside-actions">
              <a
                v-if="project.demoUrl"
                :href="project.demoUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-primary"
              >
                在线演示 <span aria-hidden="true">↗</span>
              </a>
              <a
                v-if="project.repoUrl"
                :href="project.repoUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-ghost"
              >
                查看代码 <span aria-hidden="true">↗</span>
              </a>
            </div>

            <RouterLink to="/contact" class="aside-contact">对这个项目有想法？聊聊 →</RouterLink>
          </aside>
        </div>
      </article>
    </StatusBlock>
  </div>
</template>

<style scoped>
.detail-page {
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

.detail-header {
  padding-bottom: 40px;
  border-bottom: 1px solid var(--line);
}

.eyebrow {
  margin: 0 0 18px;
  font-size: 0.75rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
}

h1 {
  margin: 0;
  max-width: 820px;
  font-family: var(--font-display);
  font-size: clamp(2.2rem, 5vw, 3.6rem);
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.025em;
  color: var(--ink);
}

.detail-summary {
  margin: 20px 0 26px;
  max-width: 680px;
  color: var(--ink-soft);
  font-size: 1.02rem;
  line-height: 1.85;
}

.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 64px;
  padding: 48px 0 24px;
}

.detail-aside {
  position: sticky;
  top: 104px;
  align-self: start;
  padding-left: 24px;
  border-left: 1px solid var(--line);
}

.meta-list {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.meta-list div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-list dt {
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

.meta-list dd {
  margin: 0;
  font-size: 0.92rem;
  color: var(--ink);
}

.aside-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 28px;
}

.aside-contact {
  display: inline-block;
  margin-top: 26px;
  color: var(--ink-muted);
  font-size: 0.82rem;
  text-decoration: none;
  line-height: 1.6;
}

.aside-contact:hover {
  color: var(--accent);
}

@media (max-width: 900px) {
  .detail-layout {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .detail-aside {
    position: static;
    padding-left: 0;
    padding-top: 28px;
    border-left: none;
    border-top: 1px solid var(--line);
  }

  .aside-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
