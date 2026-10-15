import { ref } from 'vue';
import { resolveTheme, readStoredTheme, saveTheme, applyTheme } from '@/utils/theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function systemPrefersDark() {
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches;
}

// 狀態放模組層級：所有元件共用同一份主題，切換後各處立即同步
const stored = readStoredTheme();
const theme = ref(resolveTheme({ stored, systemDark: systemPrefersDark() }));
let followSystem = !(stored === 'light' || stored === 'dark');
let listening = false;

function listenToSystem() {
  if (listening || typeof window.matchMedia !== 'function') return;
  listening = true;
  window.matchMedia(DARK_QUERY).addEventListener('change', (e) => {
    if (!followSystem) return;
    theme.value = e.matches ? 'dark' : 'light';
    applyTheme(theme.value);
  });
}

export function useTheme() {
  applyTheme(theme.value);
  if (followSystem) listenToSystem();

  function toggle() {
    followSystem = false; // 儲存失敗也算已手動選擇，不再跟隨系統
    theme.value = theme.value === 'dark' ? 'light' : 'dark';
    applyTheme(theme.value);
    saveTheme(theme.value);
  }

  return { theme, toggle };
}
