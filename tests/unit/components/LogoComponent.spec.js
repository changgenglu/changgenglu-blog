import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import LogoComponent from '@/components/LogoComponent.vue';

// Mock vue-router's useRouter and useRoute
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
};
const mockRoute = {
  query: {},
};
vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useRouter: () => mockRouter,
    useRoute: () => mockRoute,
  };
});


describe('LogoComponent.vue', () => {
  let wrapper;

  beforeEach(() => {
    // Reset window.innerWidth for predictable tests
    window.innerWidth = 1024; // Default to desktop size
    vi.spyOn(window, 'addEventListener');
    vi.spyOn(window, 'removeEventListener');

    wrapper = mount(LogoComponent, {
      global: {
        stubs: {
          RouterLink: { template: '<div><slot /></div>' } // Render slot content
        }
      }
    });
  });

  afterEach(() => {
    wrapper.unmount();
    vi.restoreAllMocks(); // Restore mocks after each test
  });

  it('應正確渲染 Logo 和標題', () => {
    expect(wrapper.find('img.myLogo').exists()).toBe(true);
    expect(wrapper.find('.fs-1').text()).toBe('Changgenglu');
  });

  it('mounted 時應呼叫 checkDevice 並監聽 resize 事件', () => {
    expect(window.addEventListener).toHaveBeenCalledWith('resize', wrapper.vm.checkDevice);
    expect(wrapper.vm.isMobile).toBe(false); // Default window.innerWidth = 1024
  });

  it('當視窗寬度小於 768px 時應設置 isMobile 為 true', async () => {
    // Simulate mobile viewport
    window.innerWidth = 700;
    window.dispatchEvent(new Event('resize')); // Trigger resize event
    await wrapper.vm.$nextTick(); // Wait for Vue to react
    expect(wrapper.vm.isMobile).toBe(true);
  });

  it('當視窗寬度大於或等於 768px 時應設置 isMobile 為 false', async () => {
    // First, set to mobile
    window.innerWidth = 700;
    window.dispatchEvent(new Event('resize'));
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.isMobile).toBe(true);

    // Then, set to desktop
    window.innerWidth = 800;
    window.dispatchEvent(new Event('resize'));
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.isMobile).toBe(false);
  });

  it('組件銷毀時應移除 resize 事件監聽器', () => {
    wrapper.unmount();
    expect(window.removeEventListener).toHaveBeenCalledWith('resize', wrapper.vm.checkDevice);
  });
});
