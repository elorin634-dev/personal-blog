<script setup>
defineProps({
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
});

defineEmits(['retry']);
</script>

<template>
  <div v-if="loading" class="skeleton-wrap" aria-busy="true" aria-live="polite">
    <div v-for="n in 3" :key="n" class="skeleton-row">
      <span class="skeleton-line w-20"></span>
      <span class="skeleton-line w-70"></span>
      <span class="skeleton-line w-90"></span>
    </div>
    <span class="visually-hidden">内容加载中</span>
  </div>

  <div v-else-if="error" class="status-error" role="alert">
    <p class="error-title">内容没能加载出来</p>
    <p class="error-message">{{ error }}</p>
    <button type="button" class="btn btn-ghost" @click="$emit('retry')">重新加载</button>
  </div>

  <slot v-else />
</template>

<style scoped>
.skeleton-wrap {
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding: 12px 0;
}

.skeleton-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    var(--surface-soft) 25%,
    var(--line) 37%,
    var(--surface-soft) 63%
  );
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}

.w-20 {
  width: 20%;
  height: 9px;
}

.w-70 {
  width: 70%;
}

.w-90 {
  width: 90%;
}

@keyframes shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-line {
    animation: none;
  }
}

.status-error {
  padding: 28px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
}

.error-title {
  margin: 0 0 8px;
  font-weight: 600;
  color: var(--ink);
}

.error-message {
  margin: 0 0 18px;
  color: var(--ink-soft);
  font-size: 0.9rem;
  line-height: 1.7;
}
</style>
