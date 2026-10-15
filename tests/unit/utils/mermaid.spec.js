import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  findMermaidBlocks,
  mermaidThemeFor,
  createMermaidLoader,
  renderMermaidBlocks,
} from '@/utils/mermaid';

function articleWith(html) {
  const root = document.createElement('div');
  root.innerHTML = html;
  document.body.appendChild(root);
  return root;
}

const mermaidBlock = src => `<pre><code class="language-mermaid">${src}</code></pre>`;
const jsBlock = '<pre><code class="language-javascript">const a = 1;</code></pre>';

function fakeMermaid() {
  return {
    initialize: vi.fn(),
    render: vi.fn().mockImplementation(async (id, src) => ({ svg: `<svg data-src="${src}"></svg>` })),
  };
}

describe('findMermaidBlocks', () => {
  it('should return only the mermaid code blocks', () => {
    const root = articleWith(mermaidBlock('graph TD;A-->B') + jsBlock + mermaidBlock('graph LR;C-->D'));
    expect(findMermaidBlocks(root)).toHaveLength(2);
  });

  it('should return an empty list when the article has no mermaid block', () => {
    expect(findMermaidBlocks(articleWith(jsBlock))).toEqual([]);
  });
});

describe('mermaidThemeFor', () => {
  it('should use the dark mermaid theme for the dark site theme', () => {
    expect(mermaidThemeFor('dark')).toBe('dark');
  });

  it('should use the default mermaid theme for the light site theme', () => {
    expect(mermaidThemeFor('light')).toBe('default');
  });

  it('should fall back to the default mermaid theme for an unknown value', () => {
    expect(mermaidThemeFor(undefined)).toBe('default');
  });
});

describe('createMermaidLoader', () => {
  it('should not call the importer until load is called', () => {
    const importer = vi.fn();
    createMermaidLoader(importer);
    expect(importer).not.toHaveBeenCalled();
  });

  it('should resolve to the default export of the imported module', async () => {
    const mermaid = fakeMermaid();
    const load = createMermaidLoader(() => Promise.resolve({ default: mermaid }));
    expect(await load()).toBe(mermaid);
  });

  it('should import only once across repeated loads', async () => {
    const importer = vi.fn().mockResolvedValue({ default: fakeMermaid() });
    const load = createMermaidLoader(importer);
    await load();
    await load();
    expect(importer).toHaveBeenCalledTimes(1);
  });

  it('should reject when the import fails and retry on the next load', async () => {
    const mermaid = fakeMermaid();
    const importer = vi.fn()
      .mockRejectedValueOnce(new Error('chunk failed'))
      .mockResolvedValueOnce({ default: mermaid });
    const load = createMermaidLoader(importer);
    await expect(load()).rejects.toThrow('chunk failed');
    expect(await load()).toBe(mermaid);
  });
});

describe('renderMermaidBlocks', () => {
  let mermaid;
  let load;

  beforeEach(() => {
    document.body.innerHTML = '';
    mermaid = fakeMermaid();
    load = vi.fn().mockResolvedValue(mermaid);
  });

  it('should replace each mermaid code block with a figure holding the svg', async () => {
    const root = articleWith(mermaidBlock('graph TD;A-->B'));
    await renderMermaidBlocks(root, { load, theme: 'default' });
    expect(root.querySelector('pre')).toBeNull();
    expect(root.querySelector('figure.mermaid-diagram svg')).not.toBeNull();
  });

  it('should pass the block source text to mermaid.render', async () => {
    const root = articleWith(mermaidBlock('graph TD;A-->B'));
    await renderMermaidBlocks(root, { load, theme: 'default' });
    expect(mermaid.render.mock.calls[0][1]).toBe('graph TD;A-->B');
  });

  it('should initialize mermaid with the given theme and without startOnLoad', async () => {
    const root = articleWith(mermaidBlock('graph TD;A-->B'));
    await renderMermaidBlocks(root, { load, theme: 'dark' });
    expect(mermaid.initialize).toHaveBeenCalledWith(expect.objectContaining({ theme: 'dark', startOnLoad: false }));
  });

  it('should give every diagram a distinct render id', async () => {
    const root = articleWith(mermaidBlock('graph TD;A-->B') + mermaidBlock('graph LR;C-->D'));
    await renderMermaidBlocks(root, { load, theme: 'default' });
    const ids = mermaid.render.mock.calls.map(c => c[0]);
    expect(new Set(ids).size).toBe(2);
  });

  it('should leave non-mermaid code blocks untouched', async () => {
    const root = articleWith(jsBlock + mermaidBlock('graph TD;A-->B'));
    await renderMermaidBlocks(root, { load, theme: 'default' });
    expect(root.querySelectorAll('pre')).toHaveLength(1);
  });

  it('should not load mermaid when the article has no mermaid block', async () => {
    const root = articleWith(jsBlock);
    await renderMermaidBlocks(root, { load, theme: 'default' });
    expect(load).not.toHaveBeenCalled();
  });

  it('should report how many diagrams rendered and failed', async () => {
    mermaid.render
      .mockResolvedValueOnce({ svg: '<svg></svg>' })
      .mockRejectedValueOnce(new Error('Parse error'));
    const root = articleWith(mermaidBlock('graph TD;A-->B') + mermaidBlock('not a diagram'));
    expect(await renderMermaidBlocks(root, { load, theme: 'default' })).toEqual({ rendered: 1, failed: 1 });
  });

  it('should keep the original code and add an error note on a syntax error', async () => {
    mermaid.render.mockRejectedValue(new Error('Parse error'));
    const root = articleWith(mermaidBlock('not a diagram'));
    await renderMermaidBlocks(root, { load, theme: 'default' });
    expect(root.querySelector('pre code').textContent).toBe('not a diagram');
    expect(root.querySelector('.mermaid-error')).not.toBeNull();
  });

  it('should keep the original code and add an error note when mermaid fails to load', async () => {
    load.mockRejectedValue(new Error('chunk failed'));
    const root = articleWith(mermaidBlock('graph TD;A-->B') + mermaidBlock('graph LR;C-->D'));
    await expect(renderMermaidBlocks(root, { load, theme: 'default' })).resolves.toEqual({ rendered: 0, failed: 2 });
    expect(root.querySelectorAll('pre')).toHaveLength(2);
    expect(root.querySelectorAll('.mermaid-error').length).toBeGreaterThanOrEqual(1);
  });

  it('should add a zoom button labelled 放大 to each diagram', async () => {
    const root = articleWith(mermaidBlock('graph TD;A-->B'));
    await renderMermaidBlocks(root, { load, theme: 'default' });
    const btn = root.querySelector('figure.mermaid-diagram button');
    expect(btn.textContent).toContain('放大');
    expect(btn.getAttribute('type')).toBe('button');
  });

  it('should call onOpen with the svg markup and the zoom button when the button is clicked', async () => {
    const onOpen = vi.fn();
    const root = articleWith(mermaidBlock('graph TD;A-->B'));
    await renderMermaidBlocks(root, { load, theme: 'default', onOpen });
    const btn = root.querySelector('figure.mermaid-diagram button');
    btn.click();
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen.mock.calls[0][0].svg).toContain('<svg');
    expect(onOpen.mock.calls[0][0].trigger).toBe(btn);
  });

  it('should also call onOpen when the diagram itself is clicked', async () => {
    const onOpen = vi.fn();
    const root = articleWith(mermaidBlock('graph TD;A-->B'));
    await renderMermaidBlocks(root, { load, theme: 'default', onOpen });
    root.querySelector('figure.mermaid-diagram svg').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('should re-render already rendered diagrams from their source with the new theme', async () => {
    const root = articleWith(mermaidBlock('graph TD;A-->B'));
    await renderMermaidBlocks(root, { load, theme: 'default' });
    mermaid.render.mockClear();
    mermaid.initialize.mockClear();
    await renderMermaidBlocks(root, { load, theme: 'dark' });
    expect(mermaid.initialize).toHaveBeenCalledWith(expect.objectContaining({ theme: 'dark' }));
    expect(mermaid.render.mock.calls[0][1]).toBe('graph TD;A-->B');
    expect(root.querySelectorAll('figure.mermaid-diagram')).toHaveLength(1);
  });

  it('should not nest a second figure or button when re-rendering', async () => {
    const root = articleWith(mermaidBlock('graph TD;A-->B'));
    await renderMermaidBlocks(root, { load, theme: 'default' });
    await renderMermaidBlocks(root, { load, theme: 'dark' });
    expect(root.querySelectorAll('figure.mermaid-diagram button')).toHaveLength(1);
  });
});
