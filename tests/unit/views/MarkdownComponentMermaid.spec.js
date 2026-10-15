import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockParseMarkdown, mermaidMock } = vi.hoisted(() => ({
  mockParseMarkdown: vi.fn(),
  mermaidMock: { initialize: vi.fn(), render: vi.fn() },
}));
vi.mock('@/utils/markdownParser', () => ({ parseMarkdown: mockParseMarkdown }));
vi.mock('mermaid', () => ({ default: mermaidMock }));

import { mount, flushPromises } from '@vue/test-utils';
import MarkdownComponent from '@/views/MarkdownComponent.vue';
import { createRouter, createMemoryHistory } from 'vue-router';

// 以 v-html 渲染傳入的 HTML，等同 markdown-it 輸出 <pre><code class="language-mermaid">
const MarkdownStub = {
  template: '<div class="markdown-content" v-html="source"></div>',
  props: ['source'],
};

const articles = {
  Diagram: '<h2>流程</h2><pre><code class="language-mermaid">graph TD;A--&gt;B</code></pre>',
  Broken: '<pre><code class="language-mermaid">not a diagram</code></pre>',
};

let router;
let wrapper;

async function mountAt(title) {
  await router.push(`/${title}`);
  wrapper = mount(MarkdownComponent, {
    global: { plugins: [router], stubs: { Markdown: MarkdownStub, 'scroll-to-top-button': true } },
    attachTo: document.body,
  });
  await flushPromises();
}

const zoomBtn = () => document.querySelector('figure.mermaid-diagram button');

describe('MarkdownComponent mermaid diagrams', () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = 'light';
    Element.prototype.scrollIntoView = vi.fn();
    mermaidMock.initialize.mockReset();
    mermaidMock.render.mockReset().mockImplementation(async () => ({ svg: '<svg id="out"></svg>' }));
    mockParseMarkdown.mockImplementation(text => ({ content: text, tocContent: '' }));
    global.fetch = vi.fn().mockImplementation(url => {
      const key = Object.keys(articles).find(k => decodeURIComponent(url).includes(`/${k}`));
      return Promise.resolve({ ok: true, text: () => Promise.resolve(articles[key]) });
    });
    router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:title', component: { template: '<div></div>' } }],
    });
  });

  afterEach(() => {
    wrapper?.unmount();
    delete document.documentElement.dataset.theme;
    delete Element.prototype.scrollIntoView;
    document.body.style.overflow = '';
  });

  it('should render a mermaid block as a diagram instead of raw code', async () => {
    await mountAt('Diagram');
    expect(document.querySelector('.markdown-content figure.mermaid-diagram svg')).not.toBeNull();
    expect(document.querySelector('.markdown-content pre')).toBeNull();
  });

  it('should initialize mermaid with the default theme under the light site theme', async () => {
    await mountAt('Diagram');
    expect(mermaidMock.initialize).toHaveBeenCalledWith(expect.objectContaining({ theme: 'default' }));
  });

  it('should initialize mermaid with the dark theme under the dark site theme', async () => {
    document.documentElement.dataset.theme = 'dark';
    await mountAt('Diagram');
    expect(mermaidMock.initialize).toHaveBeenCalledWith(expect.objectContaining({ theme: 'dark' }));
  });

  it('should re-render the diagram with the dark theme when the site theme switches', async () => {
    await mountAt('Diagram');
    mermaidMock.initialize.mockClear();
    mermaidMock.render.mockClear();
    document.documentElement.dataset.theme = 'dark';
    await flushPromises();
    expect(mermaidMock.initialize).toHaveBeenCalledWith(expect.objectContaining({ theme: 'dark' }));
    expect(mermaidMock.render).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll('.markdown-content figure.mermaid-diagram')).toHaveLength(1);
  });

  it('should keep the code and show an error note when the diagram has a syntax error', async () => {
    mermaidMock.render.mockRejectedValue(new Error('Parse error'));
    await mountAt('Broken');
    expect(document.querySelector('.markdown-content pre code').textContent).toBe('not a diagram');
    expect(document.querySelector('.markdown-content .mermaid-error')).not.toBeNull();
  });

  it('should open a modal viewer with the diagram svg when the zoom button is clicked', async () => {
    await mountAt('Diagram');
    zoomBtn().click();
    await flushPromises();
    const dlg = document.querySelector('[role="dialog"][aria-modal="true"]');
    expect(dlg).not.toBeNull();
    expect(dlg.querySelector('svg#out')).not.toBeNull();
  });

  it('should close the viewer on Escape and return focus to the zoom button', async () => {
    await mountAt('Diagram');
    zoomBtn().focus();
    zoomBtn().click();
    await flushPromises();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await flushPromises();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(zoomBtn());
  });

  it('should lock body scroll while the viewer is open', async () => {
    await mountAt('Diagram');
    zoomBtn().click();
    await flushPromises();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should stop observing the theme after the component unmounts', async () => {
    await mountAt('Diagram');
    expect(mermaidMock.render).toHaveBeenCalledTimes(1);
    wrapper.unmount();
    wrapper = null;
    mermaidMock.render.mockClear();
    document.documentElement.dataset.theme = 'dark';
    await flushPromises();
    expect(mermaidMock.render).not.toHaveBeenCalled();
  });
});
