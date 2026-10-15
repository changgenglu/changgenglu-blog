import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// mermaid 模組工廠只在第一次 import 時執行；計數能證明沒有 mermaid 區塊的文章不會載入它
const { mockParseMarkdown, mermaidLoaded } = vi.hoisted(() => ({
  mockParseMarkdown: vi.fn(),
  mermaidLoaded: vi.fn(),
}));
vi.mock('@/utils/markdownParser', () => ({ parseMarkdown: mockParseMarkdown }));
vi.mock('mermaid', () => {
  mermaidLoaded();
  return { default: { initialize: vi.fn(), render: vi.fn() } };
});

import { mount, flushPromises } from '@vue/test-utils';
import MarkdownComponent from '@/views/MarkdownComponent.vue';
import { createRouter, createMemoryHistory } from 'vue-router';

const MarkdownStub = {
  template: '<div class="markdown-content" v-html="source"></div>',
  props: ['source'],
};

let wrapper;

describe('MarkdownComponent mermaid lazy loading', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    mockParseMarkdown.mockImplementation(text => ({ content: text, tocContent: '' }));
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<h2>一般文章</h2><pre><code class="language-javascript">const a = 1;</code></pre>'),
    });
  });

  afterEach(() => {
    wrapper?.unmount();
    delete Element.prototype.scrollIntoView;
  });

  it('should not load mermaid for an article without mermaid blocks', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:title', component: { template: '<div></div>' } }],
    });
    await router.push('/Plain');
    wrapper = mount(MarkdownComponent, {
      global: { plugins: [router], stubs: { Markdown: MarkdownStub, 'scroll-to-top-button': true } },
      attachTo: document.body,
    });
    await flushPromises();
    expect(document.querySelector('.markdown-content pre')).not.toBeNull();
    expect(mermaidLoaded).not.toHaveBeenCalled();
  });
});
