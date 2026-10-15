import { describe, it, expect, vi, afterEach } from 'vitest';
import { resolveTheme, readStoredTheme, saveTheme, applyTheme } from '@/utils/theme';

describe('theme utils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  describe('resolveTheme', () => {
    it('should return dark when nothing is stored and system prefers dark', () => {
      expect(resolveTheme({ stored: null, systemDark: true })).toBe('dark');
    });

    it('should return light when nothing is stored and system prefers light', () => {
      expect(resolveTheme({ stored: null, systemDark: false })).toBe('light');
    });

    it('should prefer stored light over system dark', () => {
      expect(resolveTheme({ stored: 'light', systemDark: true })).toBe('light');
    });

    it('should prefer stored dark over system light', () => {
      expect(resolveTheme({ stored: 'dark', systemDark: false })).toBe('dark');
    });

    it.each(['blue', '', 'DARK', 'undefined'])(
      'should ignore invalid stored value %j and follow the system',
      (stored) => {
        expect(resolveTheme({ stored, systemDark: true })).toBe('dark');
        expect(resolveTheme({ stored, systemDark: false })).toBe('light');
      }
    );

    it('should return light when systemDark is undefined (matchMedia unavailable)', () => {
      expect(resolveTheme({ stored: null, systemDark: undefined })).toBe('light');
    });
  });

  describe('readStoredTheme', () => {
    it('should return the stored value', () => {
      window.localStorage.setItem('theme', 'dark');
      expect(readStoredTheme()).toBe('dark');
    });

    it('should return null when nothing is stored', () => {
      expect(readStoredTheme()).toBeNull();
    });

    it('should return null without throwing when getItem throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('denied');
      });
      expect(readStoredTheme()).toBeNull();
    });
  });

  describe('saveTheme', () => {
    it('should persist the theme under the theme key', () => {
      saveTheme('light');
      expect(window.localStorage.getItem('theme')).toBe('light');
    });

    it('should not throw when setItem throws', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota');
      });
      expect(() => saveTheme('dark')).not.toThrow();
    });
  });

  describe('applyTheme', () => {
    it('should set data-theme on the html element', () => {
      applyTheme('dark');
      expect(document.documentElement.dataset.theme).toBe('dark');
      applyTheme('light');
      expect(document.documentElement.dataset.theme).toBe('light');
    });
  });
});
