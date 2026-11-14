<script setup>
import { computed } from 'vue';

const props = defineProps({
  pagination: { type: Object, required: true },
});

const emit = defineEmits(['change']);

const canPrev = computed(() => props.pagination.page > 1);
const canNext = computed(() => props.pagination.page < props.pagination.totalPages);

function go(page) {
  if (page === props.pagination.page) return;
  if (page < 1 || page > props.pagination.totalPages) return;
  emit('change', page);
}
</script>

<template>
  <div v-if="pagination.totalPages > 1" class="pagination">
    <button
      type="button"
      class="page-btn"
      :disabled="!canPrev"
      aria-label="上一页"
      @click="go(pagination.page - 1)"
    >
      <span aria-hidden="true">←</span>
      上一页
    </button>

    <p class="page-status">
      第 <strong>{{ pagination.page }}</strong> / {{ pagination.totalPages }} 页
      <span class="page-total">共 {{ pagination.total }} 篇</span>
    </p>

    <button
      type="button"
      class="page-btn"
      :disabled="!canNext"
      aria-label="下一页"
      @click="go(pagination.page + 1)"
    >
      下一页
      <span aria-hidden="true">→</span>
    </button>
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--line);
}

.page-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  color: var(--ink-soft);
  font-size: 0.86rem;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--surface-soft);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-status {
  margin: 0;
  font-size: 0.84rem;
  color: var(--ink-muted);
}

.page-status strong {
  color: var(--ink);
}

.page-total {
  margin-left: 8px;
  padding-left: 8px;
  border-left: 1px solid var(--line);
}

@media (max-width: 560px) {
  .page-total {
    display: none;
  }

  .page-btn {
    padding: 8px 12px;
  }
}
</style>
