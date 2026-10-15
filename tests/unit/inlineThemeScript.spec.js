import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { resolveTheme } from '@/utils/theme';

const html = fs.readFileSync(path.resolve(__dirname, '../../public/index.html'), 'utf-8');

// 取 <head> 內第一段沒有 src 的同步 <script>，即首次繪製前的主題初始化腳本
function extractInlineScript() {
  const head = html.split('</head>')[0];
  const m = head.match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/i);
  return m ? m[1] : null;
}

function runScript(code, { stored, systemDark, storageThrows = false, noMatchMedia = false }) {
  const dataset = {};
  const win = {
    localStorage: {
      getItem: () => {
        if (storageThrows) throw new Error('denied');
        return stored === undefined ? null : stored;
      },
    },
    document: { documentElement: { dataset } },
  };
  if (!noMatchMedia) win.matchMedia = () => ({ matches: systemDark });
  const ctx = vm.createContext({ ...win, window: win });
  vm.runInContext(code, ctx);
  return dataset.theme;
}

const cases = [
  ['no stored value, system dark', { stored: null, systemDark: true }],
  ['no stored value, system light', { stored: null, systemDark: false }],
  ['stored light, system dark', { stored: 'light', systemDark: true }],
  ['stored dark, system light', { stored: 'dark', systemDark: false }],
  ['invalid stored value, system dark', { stored: 'blue', systemDark: true }],
  ['invalid stored value, system light', { stored: 'blue', systemDark: false }],
  ['getItem throws, system dark', { stored: null, systemDark: true, storageThrows: true }],
  ['matchMedia missing', { stored: null, systemDark: false, noMatchMedia: true }],
];

describe('inline theme script in public/index.html', () => {
  it('should exist as a synchronous inline script in head', () => {
    expect(extractInlineScript()).not.toBeNull();
  });

  it('should be at most 8 lines long', () => {
    const lines = extractInlineScript().trim().split('\n').length;
    expect(lines).toBeLessThanOrEqual(8);
  });

  it.each(cases)('should match resolveTheme when %s', (_label, input) => {
    const code = extractInlineScript();
    const expected = resolveTheme({
      stored: input.storageThrows ? null : input.stored,
      systemDark: input.noMatchMedia ? false : input.systemDark,
    });
    expect(runScript(code, input)).toBe(expected);
  });
});
