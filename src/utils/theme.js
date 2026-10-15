const KEY = 'theme';

// public/index.html 的內聯腳本是這份規則的最小複本，修改時兩處同步（inlineThemeScript.spec.js 會比對）
export function resolveTheme({ stored, systemDark }) {
  if (stored === 'light' || stored === 'dark') return stored;
  return systemDark ? 'dark' : 'light';
}

export function readStoredTheme() {
  try {
    return window.localStorage.getItem(KEY);
  } catch (e) {
    return null;
  }
}

export function saveTheme(theme) {
  try {
    window.localStorage.setItem(KEY, theme);
  } catch (e) {
    // 儲存不可用（隱私模式等）：主題只在本次 session 生效
  }
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}
