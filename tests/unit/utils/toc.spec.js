import { describe, it, expect } from 'vitest';
import { buildToc, shouldShowToc, extractHeadings } from '@/utils/toc';

function render(html) {
  const root = document.createElement('div');
  root.innerHTML = html;
  return root;
}

describe('buildToc', () => {
  it('should assign sequential ids and trim text', () => {
    expect(buildToc([' 安裝 ', 'Usage'])).toEqual([
      { id: 'toc-0', text: '安裝' },
      { id: 'toc-1', text: 'Usage' },
    ]);
  });

  it('should give duplicate and CJK titles distinct ids', () => {
    const ids = buildToc(['概述', '概述', '概述']).map(i => i.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('should return an empty list for no titles', () => {
    expect(buildToc([])).toEqual([]);
  });
});

describe('shouldShowToc', () => {
  it.each([[0, false], [1, false], [2, true], [5, true]])(
    'should return %s-heading result %s', (count, expected) => {
      const items = buildToc(Array.from({ length: count }, (_, i) => `h${i}`));
      expect(shouldShowToc(items)).toBe(expected);
    });
});

describe('extractHeadings', () => {
  it('should list only h2 headings in document order', () => {
    const root = render('<h1>主標</h1><h2>A</h2><h3>子</h3><h2>B</h2>');
    expect(extractHeadings(root).map(i => i.text)).toEqual(['A', 'B']);
  });

  it('should set the matching id on each h2 element', () => {
    const root = render('<h2>安裝</h2><h2>安裝</h2>');
    const items = extractHeadings(root);
    const h2s = root.querySelectorAll('h2');
    expect(items.map(i => i.id)).toEqual([h2s[0].id, h2s[1].id]);
    expect(h2s[0].id).not.toBe(h2s[1].id);
  });

  it('should ignore ## text inside code blocks', () => {
    const root = render('<h2>真標題</h2><pre><code>## 註解不是標題\n## 另一行</code></pre>');
    expect(extractHeadings(root)).toHaveLength(1);
  });

  it('should return an empty list when there is no h2', () => {
    expect(extractHeadings(render('<p>無章節</p>'))).toEqual([]);
  });

  it('should keep heading html out of the text field', () => {
    const root = render('<h2>Hello <em>world</em></h2>');
    expect(extractHeadings(root)[0].text).toBe('Hello world');
  });
});
