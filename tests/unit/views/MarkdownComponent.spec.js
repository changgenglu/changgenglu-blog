import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import MarkdownComponent from '@/views/MarkdownComponent.vue';
import { createRouter, createWebHistory } from 'vue-router';

// Mock Router
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/:title', component: { template: '<div></div>' } }]
});

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

describe('MarkdownComponent.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders copy article button', async () => {
    router.push('/TestTitle');
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
    await new Promise(resolve => setTimeout(resolve, 0));

    const copyBtn = wrapper.find('button[title="複製文章 Markdown"]');
    expect(copyBtn.exists()).toBe(true);
  });

  it('copies article content when copy button is clicked', async () => {
    router.push('/TestTitle');
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

    wrapper.vm.markdownContent = 'Mocked Markdown';
    const copyBtn = wrapper.find('button[title="複製文章 Markdown"]');
    
    // Mock alert
    global.alert = vi.fn();
    
    await copyBtn.trigger('click');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Mocked Markdown');
  });

  it('adds copy buttons to code blocks', async () => {
    router.push('/TestTitle');
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
});
