<template>
  <div v-if="shouldShowToc(items)" class="article-toc">
    <!-- 標題按鈕放在 nav 之外：nav 內只放章節項目，讀屏的「導覽」清單才不會混入收合開關 -->
    <button
      type="button"
      class="toc-title"
      :aria-expanded="String(isOpen)"
      aria-controls="article-toc-nav"
      @click="isOpen = !isOpen"
    >
      <span>本頁章節</span>
      <span class="toc-caret" aria-hidden="true">{{ isOpen ? '−' : '+' }}</span>
    </button>
    <nav v-show="isOpen" id="article-toc-nav" aria-label="本頁章節">
      <ul class="toc-list">
        <li v-for="item in items" :key="item.id">
          <button type="button" class="toc-item" @click="select(item.id)">{{ item.text }}</button>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script>
import { shouldShowToc } from '@/utils/toc';

export default {
  name: 'ArticleToc',
  props: {
    items: { type: Array, default: () => [] },
    collapsed: { type: Boolean, default: false },
  },
  emits: ['select'],
  data() {
    return { isOpen: !this.collapsed };
  },
  watch: {
    // 視窗在桌機與手機寬度間切換時，預設展開狀態跟著變
    collapsed(value) {
      this.isOpen = !value;
    },
  },
  methods: {
    shouldShowToc,
    select(id) {
      const target = document.getElementById(id);
      if (target) {
        // 路由是 hash 模式，錨點連結會被當成換頁，所以改用 scrollIntoView
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
      this.$emit('select', id);
    },
  },
};
</script>

<style scoped>
.article-toc {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
  padding: 8px;
}

.toc-title {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: transparent;
  border: 0;
  color: var(--primary);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  cursor: pointer;
}

.toc-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.toc-item {
  display: block;
  width: 100%;
  padding: 6px 10px;
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 0.9rem;
  line-height: 1.5;
  cursor: pointer;
}

.toc-item:hover {
  background: var(--primary-soft);
  color: var(--primary);
}
</style>
