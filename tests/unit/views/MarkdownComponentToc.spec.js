import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockParseMarkdown } = vi.hoisted(() => ({ mockParseMarkdown: vi.fn() }));
vi.mock('@/utils/markdownParser', () => ({ parseMarkdown: mockParseMarkdown }));

import { mount, flushPromises } from '@vue/test-utils';
import MarkdownComponent from '@/views/MarkdownComponent.vue';
import { createRouter, createMemoryHistory } from 'vue-router';

// 以 v-html 渲染傳入的 HTML，才能用不同文章內容驗證目錄是否跟著重建
const MarkdownStub = {
  template: '<div class="markdown-content" v-html="source"></div>',
  props: ['source'],
};

const articles = {
  Two: '<h2>安裝</h2><p>a</p><h2>使用</h2><pre><code>## 程式碼註解</code></pre>',
  One: '<h2>唯一章節</h2>',
  Zero: '<p>沒有章節</p>',
  Other: '<h2>甲</h2><h2>乙</h2><h2>丙</h2>',
};

let router;
let wrapper;

async function mountAt(title) {
  await router.push(`/${title}`);
  wrapper = mount(MarkdownComponent, {
    global: {
      plugins: [router],
      stubs: { Markdown: MarkdownStub, 'scroll-to-top-button': true },
    },
    attachTo: document.body,
  });
  await flushPromises();
}

const tocNav = () => wrapper.find('nav[aria-label="本頁章節"]');

describe('MarkdownComponent table of contents', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
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
    delete Element.prototype.scrollIntoView;
  });

  it('should list rendered h2 headings and give each an id', async () => {
    await mountAt('Two');
    const h2s = wrapper.element.querySelectorAll('.markdown-content h2');
    expect(h2s).toHaveLength(2);
    expect([...h2s].every(h => h.id)).toBe(true);
    expect(tocNav().findAll('button').map(b => b.text())).toEqual(['安裝', '使用']);
  });

  it('should call scrollIntoView on the heading when a toc item is clicked', async () => {
    await mountAt('Two');
    const target = wrapper.element.querySelectorAll('.markdown-content h2')[1];
    target.scrollIntoView = vi.fn();
    await tocNav().findAll('button')[1].trigger('click');
    expect(target.scrollIntoView).toHaveBeenCalled();
  });

  it('should hide the toc when the article has no h2', async () => {
    await mountAt('Zero');
    expect(tocNav().exists()).toBe(false);
  });

  it('should hide the toc when the article has a single h2', async () => {
    await mountAt('One');
    expect(tocNav().exists()).toBe(false);
  });

  it('should rebuild the toc when only the route title changes', async () => {
    await mountAt('Two');
    await router.push('/Other');
    await flushPromises();
    expect(tocNav().findAll('button').map(b => b.text())).toEqual(['甲', '乙', '丙']);
  });

  it('should drop the toc when navigating to an article without headings', async () => {
    await mountAt('Two');
    await router.push('/Zero');
    await flushPromises();
    expect(tocNav().exists()).toBe(false);
  });
});
