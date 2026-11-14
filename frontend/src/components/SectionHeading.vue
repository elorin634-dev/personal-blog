<script setup>
defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, required: true },
});
</script>

<template>
  <div class="section-heading">
    <div>
      <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
      <h2>{{ title }}</h2>
    </div>
    <div class="section-action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 32px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line);
}

.eyebrow {
  margin: 0 0 10px;
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent);
}

h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 3vw, 2.1rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--ink);
}

.section-action {
  flex-shrink: 0;
  padding-bottom: 4px;
}

@media (max-width: 560px) {
  .section-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
  }
}
</style>
