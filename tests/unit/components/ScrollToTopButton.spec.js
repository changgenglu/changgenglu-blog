import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ScrollToTopButton from '@/components/ScrollToTopButton.vue';

describe('ScrollToTopButton.vue', () => {
  let wrapper;
  let scrollToSpy;

  beforeEach(() => {
    // Mock window.scrollY and window.innerHeight
    Object.defineProperty(window, 'scrollY', { writable: true, value: 0 });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 800 });
    
    // Mock window.scrollTo
    scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    
    vi.spyOn(window, 'addEventListener');
    vi.spyOn(window, 'removeEventListener');

    wrapper = mount(ScrollToTopButton);
  });

  afterEach(() => {
    wrapper.unmount();
    vi.restoreAllMocks();
  });

  it('初始狀態下按鈕不應顯示', () => {
    expect(wrapper.vm.showButton).toBe(false);
    expect(wrapper.find('.scroll-to-top-button').exists()).toBe(false);
  });

  it('mounted 時應添加 scroll 事件監聽器', () => {
    expect(window.addEventListener).toHaveBeenCalledWith('scroll', wrapper.vm.handleScroll);
  });

  it('當滾動位置超過閾值時按鈕應顯示', async () => {
    // Simulate scrolling down
    window.scrollY = 600; // window.innerHeight (800) - footerHeight (70) - buttonOffset (30) = 700. Threshold is 700.
    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    
    // Threshold is windowHeight - footerHeight - buttonOffset = 800 - 70 - 30 = 700
    // If scrollY = 600, showButton should be false.
    expect(wrapper.vm.showButton).toBe(false); 
    expect(wrapper.find('.scroll-to-top-button').exists()).toBe(false);

    window.scrollY = 701; // Just above threshold
    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    
    expect(wrapper.vm.showButton).toBe(true);
    expect(wrapper.find('.scroll-to-top-button').exists()).toBe(true);
  });

  it('點擊按鈕時應滾動到頁面頂部', async () => {
    // Make button visible to click
    wrapper.vm.showButton = true;
    await wrapper.vm.$nextTick();

    await wrapper.find('.scroll-to-top-button').trigger('click');
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('組件銷毀時應移除 scroll 事件監聽器', () => {
    wrapper.unmount();
    expect(window.removeEventListener).toHaveBeenCalledWith('scroll', wrapper.vm.handleScroll);
  });
});
