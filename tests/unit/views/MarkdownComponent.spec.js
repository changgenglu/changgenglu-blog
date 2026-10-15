import { describe, it, expect, vi, beforeEach, beforeAll, afterEach } from 'vitest';

const { mockParseMarkdown } = vi.hoisted(() => {
  return { mockParseMarkdown: vi.fn().mockReturnValue({ content: 'mock content', tocContent: '' }) }
})

vi.mock('@/utils/markdownParser', () => ({
  parseMarkdown: mockParseMarkdown,
}));

import { mount, flushPromises } from '@vue/test-utils';
import MarkdownComponent from '@/views/MarkdownComponent.vue';
import { createRouter, createMemoryHistory } from 'vue-router';

// Mock Navigator Clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockImplementation(() => Promise.resolve()),
  },
});

// Mock fetch
global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    text: () => Promise.resolve('## Test Title\n\n```javascript\nconsole.log("hello");\n```'),
  })
);

let router;

describe('MarkdownComponent.vue', () => {
  // Ensure router is ready once before all tests
  beforeAll(async () => {
    router = createRouter({ // Initialize here for global tests
      history: createMemoryHistory(),
      routes: [{ path: '/:title', component: { template: '<div></div>' } }]
    });
    // Memory history is synchronous, so we don't strictly need await router.isReady(), 
    // but if we keep it, it shouldn't hang. If it hung before, it was likely due to WebHistory + environment issues.
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {}); // Mock console.error for error paths
    
    // Reset mock return value to default
    mockParseMarkdown.mockReturnValue({ content: 'mock content', tocContent: '' });
    
    // No need to re-initialize router here, just push route in tests.
  });

  it('renders copy article button', async () => {
    await router.push('/TestTitle'); // Await push
    await router.isReady();

    const wrapper = mount(MarkdownComponent, {
      global: {
        plugins: [router],
        stubs: {
          Markdown: {
            template: '<div class="markdown-content"><slot /><pre><code>console.log("hello");</code></pre></div>',
            props: ['source']
          },
          'scroll-to-top-button': true
        }
      }
    });

    // Wait for markdown loading
    await flushPromises();

    const copyBtn = wrapper.find('button[title="複製文章 Markdown"]');
    expect(copyBtn.exists()).toBe(true);
  });

  it('copies article content when copy button is clicked', async () => {
    await router.push('/TestTitle'); // Await push
    await router.isReady();

    const wrapper = mount(MarkdownComponent, {
      global: {
        plugins: [router],
        stubs: {
          Markdown: {
            template: '<div class="markdown-content"><pre><code>code</code></pre></div>',
            props: ['source']
          },
          'scroll-to-top-button': true
        }
      }
    });
    await flushPromises();

    wrapper.vm.markdownContent = 'Mocked Markdown';
    const copyBtn = wrapper.find('button[title="複製文章 Markdown"]');
    
    // Mock alert
    global.alert = vi.fn();
    
    await copyBtn.trigger('click');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Mocked Markdown');
  });

  it('adds copy buttons to code blocks', async () => {
    await router.push('/TestTitle'); // Await push
    await router.isReady();

    const wrapper = mount(MarkdownComponent, {
      global: {
        plugins: [router],
        stubs: {
          Markdown: {
            template: '<div class="markdown-content"><pre><code>test code</code></pre></div>',
            props: ['source']
          },
          'scroll-to-top-button': true
        }
      },
      attachTo: document.body
    });
    await flushPromises();

    // Ensure content is rendered
    wrapper.vm.isLoading = false;
    wrapper.vm.error = null;
    await wrapper.vm.$nextTick();

    // Manually trigger the logic that adds buttons
    wrapper.vm.addCopyButtons();
    await wrapper.vm.$nextTick();
    
    // Check if the button was added
    const copyCodeBtn = wrapper.find('.btn-copy-code');
    expect(copyCodeBtn.exists()).toBe(true);
    
    await copyCodeBtn.trigger('click');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test code');
    
    wrapper.unmount();
  });

  describe('章節目錄的顯示條件', () => {
    const TWO_H2 = '<h2>安裝</h2><p>a</p><h2>使用</h2>';
    // 以 v-html 渲染內容，才能讓目錄從真實的 DOM 標題建立
    const HtmlStub = {
      template: '<div class="markdown-content" v-html="source"></div>',
      props: ['source'],
    };
    let wrapper;
    const originalWidth = window.innerWidth;

    async function mountWith(html, width) {
      window.innerWidth = width;
      mockParseMarkdown.mockReturnValue({ content: html, tocContent: '' });
      await router.push('/TestError');
      await router.isReady();
      wrapper = mount(MarkdownComponent, {
        global: {
          plugins: [router],
          stubs: { Markdown: HtmlStub, 'scroll-to-top-button': true },
        },
        attachTo: document.body,
      });
      await flushPromises();
    }

    const toc = () => wrapper.find('nav[aria-label="本頁章節"]');
    // 收合開關在 nav 之外，所以「目錄存在」與「清單可見」分開判斷

    beforeEach(() => {
      global.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve({ ok: true, text: () => Promise.resolve('ignored') })
      );
    });

    afterEach(() => {
      wrapper.unmount();
      window.innerWidth = originalWidth;
      global.fetch.mockRestore();
    });

    it('非行動裝置上有章節時目錄預設展開', async () => {
      await mountWith(TWO_H2, 1024);
      expect(wrapper.find('button[aria-expanded]').attributes('aria-expanded')).toBe('true');
      expect(toc().find('ul').isVisible()).toBe(true);
    });

    it('行動裝置上無章節時不顯示目錄', async () => {
      await mountWith('<p>沒有章節</p>', 500);
      expect(toc().exists()).toBe(false);
    });

    it('行動裝置上有章節時顯示目錄標題按鈕', async () => {
      await mountWith(TWO_H2, 500);
      expect(wrapper.find('button[aria-expanded]').isVisible()).toBe(true);
    });

    it('行動裝置上目錄預設收合、清單隱藏', async () => {
      await mountWith(TWO_H2, 500);
      expect(wrapper.find('button[aria-expanded]').attributes('aria-expanded')).toBe('false');
      expect(toc().find('ul').isVisible()).toBe(false);
    });

    it('行動裝置上點目錄標題後清單展開', async () => {
      await mountWith(TWO_H2, 500);
      await wrapper.find('button[aria-expanded]').trigger('click');
      expect(wrapper.find('button[aria-expanded]').attributes('aria-expanded')).toBe('true');
      expect(toc().find('ul').isVisible()).toBe(true);
    });

    it('視窗從桌機縮到手機寬度時目錄改為收合', async () => {
      await mountWith(TWO_H2, 1024);
      window.innerWidth = 500;
      window.dispatchEvent(new Event('resize'));
      await wrapper.vm.$nextTick();
      expect(wrapper.find('button[aria-expanded]').attributes('aria-expanded')).toBe('false');
    });
  });

  describe('error handling', () => {
    let wrapper;

    beforeEach(async () => {
      // Setup a successful fetch first for base state
      global.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('## Initial Content'),
        })
      );
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockImplementation(() => Promise.resolve()),
        },
      });

      await router.push('/TestError'); // Await push
      await router.isReady();

      wrapper = mount(MarkdownComponent, {
        global: {
          plugins: [router],
          stubs: {
            Markdown: {
              template: '<div></div>',
              props: ['source']
            },
            'scroll-to-top-button': true
          }
        }
      });
      await flushPromises(); // Wait for mounted and fetch
    });

    afterEach(() => {
      wrapper.unmount();
      global.fetch.mockRestore();
    });

    it('應處理 fetch 請求失敗', async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          text: () => Promise.resolve(''),
        })
      );
      wrapper.vm.loadMarkdown();
      await flushPromises();
      // console.error is not called in component
      expect(wrapper.vm.error).toBe('文章載入失敗，請稍後再試。'); // Updated to match component's error message
    });

    it('應處理 parseMarkdown 失敗', async () => {
      // Control mockParseMarkdown to throw an error
      mockParseMarkdown.mockImplementationOnce(() => {
        throw new Error('Parsing error');
      });

      // No need to re-import component or router here, as mocks are global
      // The wrapper is already mounted in beforeEach for the 'error handling' suite
      // Just need to trigger loadMarkdown
      wrapper.vm.loadMarkdown();
      await flushPromises(); // Wait for fetch and then parseMarkdown

      // console.error is not called in component
      expect(wrapper.vm.error).toBe('文章載入失敗，請稍後再試。');
      mockParseMarkdown.mockRestore(); // Restore mock for other tests
    });

    it('應處理複製文章內容失敗', async () => {
      navigator.clipboard.writeText.mockImplementationOnce(() => Promise.reject('Clipboard error'));
      global.alert = vi.fn(); // Mock global alert

      wrapper.vm.markdownContent = 'Content to copy';
      await wrapper.vm.copyArticle();
      await flushPromises(); // Wait for promise rejection

      // The component silently fails, so we just ensure no alert was called and no error thrown
      expect(global.alert).not.toHaveBeenCalled();
    });
  });
});
