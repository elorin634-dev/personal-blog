<script setup>
import { computed, onMounted, ref } from 'vue';
import { fetchHome } from '@/api';
import { useAsyncData } from '@/composables/useAsyncData';
import { formatDate } from '@/utils/format';
import SectionHeading from '@/components/SectionHeading.vue';
import ProjectCard from '@/components/ProjectCard.vue';
import ArticleRow from '@/components/ArticleRow.vue';
import StatusBlock from '@/components/StatusBlock.vue';

const { data, loading, error, execute } = useAsyncData(fetchHome);
const avatarFailed = ref(false);

onMounted(execute);

const profile = computed(() => data.value?.profile || {});
const site = computed(() => data.value?.site || {});
const stats = computed(() => data.value?.stats || { projectCount: 0, articleCount: 0 });
const projects = computed(() => data.value?.featuredProjects || []);
const articles = computed(() => data.value?.latestArticles || []);
const contact = computed(() => data.value?.contact || {});
const social = computed(() => data.value?.social || []);
const initial = computed(() => (profile.value.name || 'B').slice(0, 1));

const latestDate = computed(() =>
  articles.value.length ? formatDate(articles.value[0].publishedAt) : ''
);
</script>

<template>
  <div class="home">
    <div class="container">
      <StatusBlock :loading="loading" :error="error" @retry="execute">
        <template v-if="data">
          <!-- Hero -->
          <section class="hero">
            <div class="hero-copy">
              <p class="eyebrow">
                <span>{{ profile.name || site.title }}</span>
                <span v-if="profile.role" class="eyebrow-divider" aria-hidden="true">/</span>
                <span v-if="profile.role">{{ profile.role }}</span>
              </p>

              <h1 class="hero-title">{{ site.description || '记录项目、文章与一些想法。' }}</h1>

              <p class="hero-bio">{{ profile.bio }}</p>

              <div class="hero-actions">
                <RouterLink to="/articles" class="btn btn-primary">
                  读文章
                  <span aria-hidden="true">→</span>
                </RouterLink>
                <RouterLink to="/projects" class="btn btn-ghost">看项目</RouterLink>
              </div>

              <dl class="hero-stats">
                <div>
                  <dt>项目</dt>
                  <dd>{{ stats.projectCount }}</dd>
                </div>
                <div>
                  <dt>文章</dt>
                  <dd>{{ stats.articleCount }}</dd>
                </div>
                <div v-if="profile.location">
                  <dt>坐标</dt>
                  <dd class="stat-text">{{ profile.location }}</dd>
                </div>
              </dl>
            </div>

            <aside class="hero-card" aria-label="个人名片">
              <div class="avatar">
                <img
                  v-if="profile.avatarUrl && !avatarFailed"
                  :src="profile.avatarUrl"
                  :alt="`${profile.name} 的头像`"
                  loading="lazy"
                  @error="avatarFailed = true"
                />
                <span v-else class="avatar-fallback" aria-hidden="true">{{ initial }}</span>
              </div>

              <div class="card-body">
                <p class="card-name">{{ profile.name }}</p>
                <p class="card-role">{{ profile.role }}</p>
                <p v-if="profile.location" class="card-location">{{ profile.location }}</p>
              </div>

              <ul v-if="social.length" class="card-social">
                <li v-for="item in social.slice(0, 4)" :key="item.platform">
                  <a :href="item.url" target="_blank" rel="noopener noreferrer">
                    {{ item.label }}
                    <span aria-hidden="true">↗</span>
                  </a>
                </li>
              </ul>
            </aside>
          </section>

          <!-- 精选项目 -->
          <section class="section">
            <SectionHeading eyebrow="Selected work" title="精选项目">
              <template #action>
                <RouterLink to="/projects" class="text-link">全部项目 →</RouterLink>
              </template>
            </SectionHeading>

            <div v-if="projects.length" class="project-grid">
              <ProjectCard
                v-for="(project, index) in projects"
                :key="project.id"
                :project="project"
                :index="index"
              />
            </div>
            <p v-else class="empty-note">还没有发布的项目。</p>
          </section>

          <!-- 最新文章 -->
          <section class="section">
            <SectionHeading eyebrow="Writing" title="最新文章">
              <template #action>
                <RouterLink to="/articles" class="text-link">全部文章 →</RouterLink>
              </template>
            </SectionHeading>

            <div v-if="articles.length" class="article-list">
              <ArticleRow
                v-for="(article, index) in articles"
                :key="article.id"
                :article="article"
                :index="index"
              />
            </div>
            <p v-else class="empty-note">还没有发布的文章。</p>
          </section>

          <!-- 联系 CTA -->
          <section class="contact-band">
            <div class="band-text">
              <p class="eyebrow">Get in touch</p>
              <h2>有想法，写封信给我。</h2>
              <p class="band-note">
                无论是项目合作、技术讨论，还是单纯想打个招呼，都欢迎。
              </p>
            </div>
            <div class="band-actions">
              <a v-if="contact.email" :href="`mailto:${contact.email}`" class="btn btn-primary">
                {{ contact.email }}
              </a>
              <RouterLink to="/contact" class="text-link">更多联系方式 →</RouterLink>
            </div>
            <p v-if="latestDate" class="band-meta">最近更新于 {{ latestDate }}</p>
          </section>
        </template>
      </StatusBlock>
    </div>
  </div>
</template>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
  gap: 64px;
  align-items: start;
  padding: 88px 0 96px;
}

.eyebrow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 0 0 24px;
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
}

.eyebrow-divider {
  color: var(--ink-muted);
}

.hero-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 5.4vw, 4.1rem);
  font-weight: 600;
  line-height: 1.14;
  letter-spacing: -0.03em;
  color: var(--ink);
  text-wrap: balance;
}

.hero-bio {
  margin: 26px 0 0;
  max-width: 52ch;
  color: var(--ink-soft);
  font-size: 1.02rem;
  line-height: 1.95;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 34px;
}

.hero-stats {
  display: flex;
  gap: 40px;
  margin: 48px 0 0;
  padding-top: 26px;
  border-top: 1px solid var(--line);
}

.hero-stats div {
  display: flex;
  flex-direction: column-reverse;
  gap: 6px;
}

.hero-stats dt {
  color: var(--ink-muted);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
}

.hero-stats dd {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.6rem;
  color: var(--ink);
  line-height: 1;
}

.hero-stats .stat-text {
  font-family: var(--font-sans);
  font-size: 0.92rem;
  padding-top: 6px;
}

.hero-card {
  position: relative;
  padding: 28px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--surface);
  box-shadow: var(--shadow-soft);
}

.avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid var(--line);
  background: var(--surface-soft);
  display: grid;
  place-items: center;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--accent);
}

.card-body {
  margin-top: 22px;
}

.card-name {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.3rem;
  color: var(--ink);
}

.card-role {
  margin: 6px 0 0;
  color: var(--ink-soft);
  font-size: 0.86rem;
}

.card-location {
  margin: 12px 0 0;
  color: var(--ink-muted);
  font-size: 0.8rem;
}

.card-social {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin: 24px 0 0;
  padding: 18px 0 0;
  border-top: 1px solid var(--line);
  list-style: none;
}

.card-social a {
  color: var(--ink-soft);
  text-decoration: none;
  font-size: 0.82rem;
  transition: color 0.2s ease;
}

.card-social a:hover {
  color: var(--accent);
}

.section {
  padding: 24px 0 72px;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.empty-note {
  padding: 32px 0;
  color: var(--ink-muted);
  font-size: 0.9rem;
}

.contact-band {
  /* 固定深色，不随主题反转：避免深色模式下出现整块浅色区域，也保证按钮对比度 */
  --band-bg: #1c1a17;
  --band-fg: #f7f2e9;
  position: relative;
  margin: 32px 0 0;
  padding: 56px;
  border-radius: 24px;
  background: var(--band-bg);
  border: 1px solid #2e2921;
  color: var(--band-fg);
  overflow: hidden;
}

.contact-band::after {
  content: '';
  position: absolute;
  right: -60px;
  top: -60px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0.18;
  filter: blur(4px);
}

.contact-band .eyebrow {
  color: #e8956f;
  margin-bottom: 16px;
}

.band-text h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 600;
  letter-spacing: -0.02em;
}

.band-note {
  margin: 14px 0 0;
  max-width: 46ch;
  color: inherit;
  opacity: 0.72;
  font-size: 0.95rem;
  line-height: 1.8;
}

.band-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
  margin-top: 32px;
}

.band-actions .btn-primary {
  background: var(--band-fg);
  border-color: var(--band-fg);
  color: var(--band-bg);
}

.band-actions .btn-primary:hover {
  background: var(--accent);
  border-color: var(--accent);
  color: #fffdf9;
}

.band-actions .text-link {
  color: var(--band-fg);
}

.band-meta {
  margin: 36px 0 0;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  opacity: 0.55;
}

@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
    gap: 40px;
    padding: 56px 0 64px;
  }

  .hero-card {
    max-width: 420px;
  }

  .project-grid {
    grid-template-columns: 1fr;
  }

  .contact-band {
    padding: 36px 28px;
  }
}

@media (max-width: 560px) {
  .hero-stats {
    gap: 28px;
  }

  .section {
    padding-bottom: 56px;
  }
}
</style>
