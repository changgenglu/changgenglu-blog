import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ArticleCard from '@/components/ArticleCard.vue';
import { createRouter, createMemoryHistory } from 'vue-router';

// Mock Router
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/:category/:title', component: { template: '<div></div>' } }, // For ArticleCard links
    { path: '/:title(.*)', name: 'Markdown', component: { template: '<div></div>' } } // Added named route
  ] 
});

describe('ArticleCard.vue', () => {
  let wrapper;
  const mockItem = {
    date: '2023-01-01T00:00:00Z',
    name: 'Test Article.md',
    matchingLines: ['## Introduction', '## Conclusion'],
    category: 'Test',
    path: 'Test/Test Article.md',
    query: 'Test', // Simulate a query for highlighting
  };

  beforeEach(async () => {
    // Mock the current date for predictable "ago" calculations
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-01T00:00:00Z')); // Set to the same as mockItem.date for "just now"
    
    wrapper = mount(ArticleCard, {
      props: {
        item: mockItem,
        isMobile: false,
        showCategory: true
      },
      global: {
        plugins: [router], // Provide router to the component
      }
    });
  });

  afterEach(() => {
    wrapper.unmount();
    vi.useRealTimers(); // Restore real timers
  });

  it('應正確渲染文章標題', () => {
    expect(wrapper.find('.card-title').exists()).toBe(true);
    // Title should be highlighted due to mockItem.query
    expect(wrapper.find('.card-title').html()).toContain('<span class="search-highlight">Test</span> Article');
  });

  it('應正確顯示文章分類', () => {
    expect(wrapper.find('.category-badge').exists()).toBe(true);
    expect(wrapper.find('.category-badge').text()).toBe('Test');
  });

  it('應正確顯示匹配的 H2 行', () => {
    expect(wrapper.findAll('.title-text').length).toBe(2);
    expect(wrapper.findAll('.title-text')[0].text()).toBe('## Introduction');
  });

  it('當有 query 且有 displaySnippet 時，應顯示 snippet', async () => {
    // Simulate a content match with snippet for display
    await wrapper.setProps({
      item: {
        ...mockItem,
        highlightedSnippet: '這是一個 <span class="search-highlight">測試</span> 片段',
        query: '測試'
      }
    });
    // Check if the snippet is rendered and highlighted
    expect(wrapper.find('.title-text').html()).toContain('<span class="search-highlight">測試</span> 片段');
    // Ensure that if snippet is displayed, matchingLines are not (v-if vs v-else-if)
    expect(wrapper.findAll('.title-text').length).toBe(1);
  });

  describe('countDate method', () => {
    it('應回傳 "just now" 如果時間差異在秒內', () => {
      vi.setSystemTime(new Date('2023-01-01T00:00:00Z'));
      const wrapperNow = mount(ArticleCard, { props: { item: { ...mockItem, date: '2023-01-01T00:00:00Z' } } });
      expect(wrapperNow.vm.countDate('2023-01-01T00:00:00Z')).toBe('just now');
      wrapperNow.unmount();
    });

    it('應回傳正確的秒數', () => {
      vi.setSystemTime(new Date('2023-01-01T00:00:59Z')); // 59 seconds later
      const wrapperSecs = mount(ArticleCard, { props: { item: { ...mockItem, date: '2023-01-01T00:00:00Z' } } });
      expect(wrapperSecs.vm.countDate('2023-01-01T00:00:00Z')).toBe('59 seconds ');
      wrapperSecs.unmount();
    });

    it('應回傳正確的分鐘數', () => {
      vi.setSystemTime(new Date('2023-01-01T00:01:00Z'));
      const wrapperMins = mount(ArticleCard, { props: { item: { ...mockItem, date: '2023-01-01T00:00:00Z' } } });
      expect(wrapperMins.vm.countDate('2023-01-01T00:00:00Z')).toBe('1 minute ');
      vi.setSystemTime(new Date('2023-01-01T00:59:00Z'));
      const wrapperMins2 = mount(ArticleCard, { props: { item: { ...mockItem, date: '2023-01-01T00:00:00Z' } } });
      expect(wrapperMins2.vm.countDate('2023-01-01T00:00:00Z')).toBe('59 minutes ');
      wrapperMins.unmount();
      wrapperMins2.unmount();
    });

    it('應回傳正確的小時數', () => {
      vi.setSystemTime(new Date('2023-01-01T01:00:00Z'));
      const wrapperHours = mount(ArticleCard, { props: { item: { ...mockItem, date: '2023-01-01T00:00:00Z' } } });
      expect(wrapperHours.vm.countDate('2023-01-01T00:00:00Z')).toBe('1 hour ');
      vi.setSystemTime(new Date('2023-01-01T23:00:00Z'));
      const wrapperHours2 = mount(ArticleCard, { props: { item: { ...mockItem, date: '2023-01-01T00:00:00Z' } } });
      expect(wrapperHours2.vm.countDate('2023-01-01T00:00:00Z')).toBe('23 hours ');
      wrapperHours.unmount();
      wrapperHours2.unmount();
    });

    it('應回傳正確的天數', () => {
      vi.setSystemTime(new Date('2023-01-02T00:00:00Z'));
      const wrapperDays = mount(ArticleCard, { props: { item: { ...mockItem, date: '2023-01-01T00:00:00Z' } } });
      expect(wrapperDays.vm.countDate('2023-01-01T00:00:00Z')).toBe('1 day ');
      vi.setSystemTime(new Date('2023-01-30T00:00:00Z'));
      const wrapperDays2 = mount(ArticleCard, { props: { item: { ...mockItem, date: '2023-01-01T00:00:00Z' } } });
      expect(wrapperDays2.vm.countDate('2023-01-01T00:00:00Z')).toBe('29 days ');
      wrapperDays.unmount();
      wrapperDays2.unmount();
    });

    it('應回傳正確的月份數', () => {
      vi.setSystemTime(new Date('2023-02-01T00:00:00Z'));
      const wrapperMonths = mount(ArticleCard, { props: { item: { ...mockItem, date: '2023-01-01T00:00:00Z' } } });
      expect(wrapperMonths.vm.countDate('2023-01-01T00:00:00Z')).toBe('1 month ');
      vi.setSystemTime(new Date('2023-12-01T00:00:00Z'));
      const wrapperMonths2 = mount(ArticleCard, { props: { item: { ...mockItem, date: '2023-01-01T00:00:00Z' } } });
      expect(wrapperMonths2.vm.countDate('2023-01-01T00:00:00Z')).toBe('11 months ');
      wrapperMonths.unmount();
      wrapperMonths2.unmount();
    });

    it('應回傳正確的年份數', () => {
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
      const wrapperYears = mount(ArticleCard, { props: { item: { ...mockItem, date: '2023-01-01T00:00:00Z' } } });
      expect(wrapperYears.vm.countDate('2023-01-01T00:00:00Z')).toBe('1 year ');
      vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
      const wrapperYears2 = mount(ArticleCard, { props: { item: { ...mockItem, date: '2023-01-01T00:00:00Z' } } });
      expect(wrapperYears2.vm.countDate('2023-01-01T00:00:00Z')).toBe('2 years ');
      wrapperYears.unmount();
      wrapperYears2.unmount();
    });
  });
});
