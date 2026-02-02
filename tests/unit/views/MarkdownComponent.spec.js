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

  describe('template conditional rendering', () => {
    let wrapper;

    beforeEach(async () => {
      // Setup default mock fetch for content
      global.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('## Test Title\n\n- item 1'),
        })
      );
      // Mock navigator.clipboard
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockImplementation(() => Promise.resolve()),
        },
      });

      await router.push('/TestError');
      await router.isReady();

      wrapper = mount(MarkdownComponent, {
        global: {
          plugins: [router],
          stubs: {
            Markdown: {
              template: '<div class="markdown-content"><slot /></div>',
              props: ['source']
            },
            'scroll-to-top-button': true
          }
        },
        props: {
          // You might need to mock route.params.title if it's used in data()
        }
      });
      await flushPromises();
    });

    afterEach(() => {
      wrapper.unmount();
      global.fetch.mockRestore();
    });

    it('toggle-menu-btn 在非行動裝置上應隱藏', async () => {
      wrapper.vm.isMobile = false;
      wrapper.vm.markdownMenu = 'some menu';
      await wrapper.vm.$nextTick();
      expect(wrapper.find('#toggle-menu-btn').isVisible()).toBe(false);
    });

    it('toggle-menu-btn 在行動裝置上且無菜單內容時應隱藏', async () => {
      wrapper.vm.isMobile = true;
      wrapper.vm.markdownMenu = '';
      await wrapper.vm.$nextTick();
      expect(wrapper.find('#toggle-menu-btn').isVisible()).toBe(false);
    });

    it('toggle-menu-btn 在行動裝置上且有菜單內容時應顯示', async () => {
      wrapper.vm.isMobile = true;
      wrapper.vm.markdownMenu = 'some menu';
      await wrapper.vm.$nextTick();
      expect(wrapper.find('#toggle-menu-btn').isVisible()).toBe(true);
    });

    it('目錄內容 (Markdown id="menu") 應在 showMenu 為 false 時隱藏', async () => {
      wrapper.vm.showMenu = false;
      wrapper.vm.markdownMenu = 'some menu';
      await wrapper.vm.$nextTick();
      // Find the div that contains the Markdown component for the menu
      const menuContainer = wrapper.find('.row > div:first-child');
      expect(menuContainer.isVisible()).toBe(false);
    });

    it('目錄內容 (Markdown id="menu") 應在 showMenu 為 true 且有菜單內容時顯示', async () => {
      wrapper.vm.showMenu = true;
      wrapper.vm.markdownMenu = 'some menu';
      await wrapper.vm.$nextTick();
      const menuContainer = wrapper.find('.row > div:first-child');
      expect(menuContainer.isVisible()).toBe(true);
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
