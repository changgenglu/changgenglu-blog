<template>
  <div class="category-chips" role="group" aria-label="文章分類">
    <button
      v-for="chip in chips"
      :key="chip.value"
      type="button"
      class="chip"
      :class="{ 'is-active': modelValue === chip.value }"
      :aria-pressed="modelValue === chip.value ? 'true' : 'false'"
      @click="$emit('update:modelValue', chip.value)"
    >
      <span class="chip-label">{{ chip.label }}</span>
      <span v-if="chip.count !== undefined" class="chip-count">{{ chip.count }}</span>
    </button>
  </div>
</template>

<script>
import { ALL } from '@/utils/articleFilter';

export default {
  name: 'CategoryChips',
  props: {
    categories: { type: Array, required: true },
    modelValue: { type: String, default: ALL },
    counts: { type: Object, default: () => ({}) }
  },
  emits: ['update:modelValue'],
  computed: {
    chips() {
      const total = Object.values(this.counts).reduce((sum, n) => sum + n, 0);
      return [
        { value: ALL, label: '全部', count: Object.keys(this.counts).length ? total : undefined },
        ...this.categories.map((c) => ({ value: c, label: c, count: this.counts[c] }))
      ];
    }
  }
};
</script>

<style scoped>
.category-chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 2px;
  max-width: 100%;
}

.chip {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--surface);
  color: var(--ink);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  cursor: pointer;
}

.chip:hover {
  border-color: var(--primary);
}

.chip.is-active {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--on-primary);
}

.chip-count {
  font-size: 0.75rem;
}
</style>
