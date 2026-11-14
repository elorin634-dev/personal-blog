<script setup>
defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
});
</script>

<template>
  <header class="page-intro">
    <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
    <h1>{{ title }}</h1>
    <p v-if="description" class="intro-desc">{{ description }}</p>
    <div class="intro-meta">
      <slot />
    </div>
  </header>
</template>

<style scoped>
.page-intro {
  padding: 72px 0 48px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 48px;
}

.eyebrow {
  margin: 0 0 16px;
  font-size: 0.75rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
}

h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2.2rem, 5vw, 3.4rem);
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.025em;
  color: var(--ink);
}

.intro-desc {
  margin: 18px 0 0;
  max-width: 40em;
  color: var(--ink-soft);
  font-size: 1rem;
  line-height: 1.85;
}

.intro-meta:not(:empty) {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 26px;
  color: var(--ink-muted);
  font-size: 0.82rem;
}

.intro-meta:not(:empty)::before {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent);
  flex: none;
}

@media (max-width: 720px) {
  .page-intro {
    padding: 48px 0 32px;
    margin-bottom: 32px;
  }
}
</style>
