<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="theme === 'dark' ? '切換為淺色主題' : '切換為深色主題'"
    :aria-pressed="theme === 'dark' ? 'true' : 'false'"
    @click="toggle"
  >
    <svg v-if="theme === 'dark'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>
    </svg>
    <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path>
    </svg>
  </button>
</template>

<script>
import { useTheme } from '@/composables/useTheme';

export default {
  name: 'ThemeToggle',
  setup() {
    return useTheme();
  }
};
</script>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: var(--surface);
  color: var(--ink);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.theme-toggle:hover {
  border-color: var(--primary);
  color: var(--primary);
}
</style>
