<script setup>
import { computed, onMounted } from 'vue';
import { fetchProjects } from '@/api';
import { useAsyncData } from '@/composables/useAsyncData';
import PageIntro from '@/components/PageIntro.vue';
import ProjectCard from '@/components/ProjectCard.vue';
import StatusBlock from '@/components/StatusBlock.vue';

const { data, loading, error, execute } = useAsyncData(fetchProjects);

onMounted(execute);

const projects = computed(() => data.value?.list || []);
const total = computed(() => data.value?.total ?? projects.value.length);
</script>

<template>
  <div class="container">
    <PageIntro
      eyebrow="Work"
      title="项目"
      description="一些自己从零做完的东西，包含正在维护的和已经归档的。每个项目都记录了当时的取舍。"
    >
      <span v-if="data">共 {{ total }} 个已发布项目</span>
    </PageIntro>

    <StatusBlock :loading="loading" :error="error" @retry="execute">
      <div v-if="projects.length" class="project-grid">
        <ProjectCard
          v-for="(project, index) in projects"
          :key="project.id"
          :project="project"
          :index="index"
        />
      </div>

      <div v-else class="empty-state">
        <p class="empty-title">项目还在路上</p>
        <p class="empty-desc">目前没有已发布的项目，过段时间再来看看。</p>
        <RouterLink to="/articles" class="text-link">先去读点文章 →</RouterLink>
      </div>
    </StatusBlock>
  </div>
</template>

<style scoped>
.project-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  padding-bottom: 16px;
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

@media (max-width: 900px) {
  .project-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .project-grid {
    grid-template-columns: 1fr;
  }
}
</style>
