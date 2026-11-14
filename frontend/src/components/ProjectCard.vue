<script setup>
defineProps({
  project: { type: Object, required: true },
  index: { type: Number, default: 0 },
});

function pad(value) {
  return String(value).padStart(2, '0');
}
</script>

<template>
  <RouterLink :to="`/projects/${project.slug}`" class="project-card">
    <div class="card-top">
      <span class="card-index">{{ pad(index + 1) }}</span>
      <span class="card-arrow" aria-hidden="true">↗</span>
    </div>

    <h3 class="card-title">{{ project.title }}</h3>
    <p class="card-summary">{{ project.summary }}</p>

    <ul v-if="project.techStack.length" class="chip-list" aria-label="技术栈">
      <li v-for="tech in project.techStack" :key="tech" class="chip">{{ tech }}</li>
    </ul>
  </RouterLink>
</template>

<style scoped>
.project-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  padding: 26px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
  color: inherit;
  text-decoration: none;
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}

.project-card:hover {
  transform: translateY(-4px);
  border-color: var(--accent);
  box-shadow: var(--shadow-soft);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-index {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--ink-muted);
  letter-spacing: 0.08em;
}

.card-arrow {
  color: var(--ink-muted);
  font-size: 1rem;
  transition: transform 0.25s ease, color 0.25s ease;
}

.project-card:hover .card-arrow {
  color: var(--accent);
  transform: translate(2px, -2px);
}

.card-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.card-summary {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.92rem;
  line-height: 1.75;
  flex: 1;
}
</style>
