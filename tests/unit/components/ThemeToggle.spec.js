import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';

// useTheme 的 ref 在模組層級，每個測試要重載模組才能從乾淨狀態開始
async function mountToggle({ systemDark = false, stored = null } = {}) {
  vi.resetModules();
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: systemDark,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  if (stored) window.localStorage.setItem('theme', stored);
  const { default: ThemeToggle } = await import('@/components/ThemeToggle.vue');
  return mount(ThemeToggle);
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete window.matchMedia;
  });

  it('should switch html data-theme between light and dark on click', async () => {
    const wrapper = await mountToggle({ systemDark: false });
    await wrapper.find('button').trigger('click');
    expect(document.documentElement.dataset.theme).toBe('dark');
    await wrapper.find('button').trigger('click');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('should start from the system theme when nothing is stored', async () => {
    const wrapper = await mountToggle({ systemDark: true });
    await wrapper.find('button').trigger('click');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('should save the chosen theme to localStorage on click', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const wrapper = await mountToggle({ systemDark: false });
    await wrapper.find('button').trigger('click');
    expect(setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('should still switch the theme without throwing when storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    const wrapper = await mountToggle({ systemDark: false });
    await expect(wrapper.find('button').trigger('click')).resolves.not.toThrow();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('should ignore an invalid stored value and follow the system theme', async () => {
    const wrapper = await mountToggle({ systemDark: true, stored: 'blue' });
    await wrapper.find('button').trigger('click');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('should expose a non-empty aria-label', async () => {
    const wrapper = await mountToggle();
    expect(wrapper.find('button').attributes('aria-label')).toBeTruthy();
  });

  it('should reflect the current theme in aria-pressed', async () => {
    const wrapper = await mountToggle({ systemDark: false });
    const btn = wrapper.find('button');
    expect(btn.attributes('aria-pressed')).toBe('false');
    await btn.trigger('click');
    expect(btn.attributes('aria-pressed')).toBe('true');
  });
});
