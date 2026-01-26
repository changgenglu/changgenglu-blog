import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import App from '@/App.vue';

// Mock components that might cause issues in a simple unit test
const LogoStub = { template: '<div class="logo-stub"></div>' };
const FooterStub = { template: '<div class="footer-stub"></div>' };
const RouterViewStub = { template: '<div class="router-view-stub"></div>' };

describe('App.vue', () => {
  it('renders the content div', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          'logo-component': LogoStub,
          'footer-component': FooterStub,
          'router-view': RouterViewStub
        }
      }
    });
    expect(wrapper.find('.content').exists()).toBe(true);
  });
});
