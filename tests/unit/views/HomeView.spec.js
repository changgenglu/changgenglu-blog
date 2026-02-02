import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { reactive } from 'vue'; // Import reactive for mockRoute.query
import HomeView from '@/views/HomeView.vue';
// import AllMyArticle from '@/assets/fileNames.json'; // Original import removed

// Mock AllMyArticle (fileNames.json) directly in vi.mock to avoid hoisting issues
const mockFileNamesJsonData = [
  { date: '2023-01-01T00:00:00Z', name: 'article1.md', matchingLines: ['## Intro'], category: 'CategoryA', path: 'CategoryA/article1.md' },
  { date: '2023-01-02T00:00:00Z', name: 'article2.md', matchingLines: ['## Setup'], category: 'CategoryB', path: 'CategoryB/article2.md' },
];
vi.mock('@/assets/fileNames.json', () => ({
  get default() { return mockFileNamesJsonData; },
}));

import { search as mockSearch } from '@/utils/searchEngine';
import SearchInput from '@/components/SearchInput.vue'; // Import the component

// Mock the searchEngine
vi.mock('@/utils/searchEngine', () => ({
  search: vi.fn(),
}));

// Mock vue-router's useRouter and useRoute
const mockRoute = {
  query: reactive({}), // Make query reactive
};
const mockRouter = {
  push: vi.fn((to) => {
    // Simulate router.push updating mockRoute.query
    if (to.query) {
      Object.assign(mockRoute.query, to.query);
      for (const key in mockRoute.query) { // Remove keys not in to.query
        if (!(key in to.query)) delete mockRoute.query[key];
      }
    } else {
      for (const key in mockRoute.query) delete mockRoute.query[key]; // Clear query
    }
    return Promise.resolve();
  }),
  replace: vi.fn((to) => {
    // Simulate router.replace updating mockRoute.query
    if (to.query) {
      Object.assign(mockRoute.query, to.query);
      for (const key in mockRoute.query) { // Remove keys not in to.query
        if (!(key in to.query)) delete mockRoute.query[key];
      }
    } else {
      for (const key in mockRoute.query) delete mockRoute.query[key]; // Clear query
    }
    return Promise.resolve();
  }),
};
vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useRouter: () => mockRouter,
    useRoute: () => mockRoute,
  };
});

describe('HomeView.vue', () => {
  let wrapper;

  beforeEach(() => {
    // Reset mocks
    mockSearch.mockClear();
    mockRouter.push.mockClear();
    mockRouter.replace.mockClear();
    // Reset mockRoute.query to empty for each test
    for (const key in mockRoute.query) {
      delete mockRoute.query[key];
    }
    vi.clearAllTimers(); // Clear any timers
    vi.useFakeTimers(); // Control timers for debounce

    // Mount the component
    wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: { template: '<div><slot /></div>' }, // Render content for category cards
          SearchInput: SearchInput // Use the actual SearchInput component
        },
        mocks: {
          $router: mockRouter,
          $route: mockRoute,
        }
      }
    });

    // The component's allArticlesMeta data property is initialized from the mocked AllMyArticle
    // when the component is mounted. We should not manually override it here,
    // nor assign other mocks to it.
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    wrapper.unmount();
  });

  it('應正確渲染類別列表', async () => {
    await flushPromises(); // Wait for component to update after mounted
    // Check if the correct number of category cards are rendered
    // The component's `categories` computed property uses `this.allArticlesMeta`
    expect(wrapper.vm.allArticlesMeta.length).toBe(mockFileNamesJsonData.length); // Verify allArticlesMeta is populated
    expect(wrapper.findAll('.category-card').length).toBe(wrapper.vm.categories.length);
  });

  it('初始載入時，如果 URL 沒有查詢參數，應顯示所有文章', async () => {
    // mockSearch.mockReturnValue([]); // Should not be called initially without query, so no need to mock return
    expect(wrapper.vm.searchText).toBe('');
    
    expect(wrapper.findComponent(SearchInput).props('modelValue')).toBe('');
    
    expect(wrapper.find('.search-section').exists()).toBe(true);
    expect(wrapper.find('.section-header h4').text()).toBe('文章分類'); // Check header for categories view

    expect(mockSearch).not.toHaveBeenCalled();
    expect(wrapper.vm.searchResults.length).toBe(mockFileNamesJsonData.length); // Should be all articles for initial state when no query
  });

  it('應從 URL 查詢參數初始化 searchText 並觸發搜尋', async () => {
    mockRoute.query.q = 'Vue'; // Set query for this specific test
    mockSearch.mockReturnValue([
      { id: 'Vue/article1.md', title: 'Vue.js 基礎', path: 'Vue/article1.md', category: 'Vue', score: 1 },
      { id: 'Vue/article3.md', title: 'Vue Router 導航', path: 'Vue/article3.md', category: 'Vue', score: 0.8 },
    ]);

    // Re-mount component to simulate fresh load with query
    // Reset wrapper for this test to re-trigger mounted with new mockRoute.query
    wrapper.unmount(); // Unmount previous wrapper
    wrapper = mount(HomeView, {
        global: {
            stubs: { RouterLink: { template: '<div><slot /></div>' }, SearchInput: SearchInput },
            mocks: { $router: mockRouter, $route: mockRoute },
        },
    });
    // wrapper.vm.allArticlesMeta = AllMyArticle; // Manual meta set - REMOVED

    await flushPromises(); // Wait for any async watchers
    await wrapper.vm.$nextTick(); // Wait for Vue's next tick

    expect(wrapper.vm.searchText).toBe('Vue');
    expect(mockSearch).toHaveBeenCalledWith('Vue');
    expect(wrapper.vm.searchResults.length).toBe(2);
    expect(wrapper.findComponent(SearchInput).props('modelValue')).toBe('Vue');
  });

  it('當 SearchInput 觸發 search 事件時，應執行搜尋並更新 URL', async () => {
    mockSearch.mockReturnValue([
      { id: 'JS/article2.md', title: 'JavaScript 進階', path: 'JS/article2.md', category: 'JavaScript', score: 1 },
    ]);

    const searchInput = wrapper.findComponent(SearchInput);
    searchInput.vm.$emit('update:modelValue', 'JavaScript'); // Simulate v-model update
    searchInput.vm.$emit('search', 'JavaScript'); // Simulate debounced search event

    await flushPromises(); // Wait for debounced search and next tick
    await wrapper.vm.$nextTick(); // Wait for Vue's next tick after router replace

    expect(wrapper.vm.searchText).toBe('JavaScript');
    expect(mockSearch).toHaveBeenCalledWith('JavaScript');
    expect(wrapper.vm.searchResults.length).toBe(1);
    expect(mockRouter.replace).toHaveBeenCalledWith({ query: { q: 'JavaScript' } });
  });

  it('當 searchText 為空時，應顯示所有文章且 URL 查詢參數為空', async () => {
    // Simulate searching for something first
    mockRoute.query.q = 'test'; // Manually set query for initial state
    mockSearch.mockReturnValue([{ id: 'mock.md', title: 'Mocked', path: 'mock.md', category: 'Test', score: 1 }]);
    wrapper.vm.handleSearch('test');
    await flushPromises();
    await wrapper.vm.$nextTick(); // Ensure Vue processed initial handleSearch

    expect(wrapper.vm.searchText).toBe('test');
    expect(wrapper.vm.searchResults.length).toBe(1);

    // Now clear the search
    const searchInput = wrapper.findComponent(SearchInput);
    searchInput.vm.$emit('update:modelValue', '');
    searchInput.vm.$emit('search', '');
    await flushPromises();
    await wrapper.vm.$nextTick(); // Wait for Vue's next tick after search event

    expect(wrapper.vm.searchText).toBe('');
    expect(mockSearch).not.toHaveBeenCalledWith(''); // MiniSearch.search should not be called with empty query
    expect(wrapper.vm.searchResults.length).toBe(mockFileNamesJsonData.length); // Should return all articles (mocked)
    expect(mockRouter.replace).toHaveBeenCalledWith({ query: {} });
  });

  it('頁面大小調整時應更新 isMobile 狀態', async () => {
    // Default isMobile should be false for desktop JSDOM environment
    expect(wrapper.vm.isMobile).toBe(false);

    // Simulate mobile viewport
    window.innerWidth = 700;
    window.dispatchEvent(new Event('resize'));
    await wrapper.vm.$nextTick(); // Wait for Vue to react to prop change
    expect(wrapper.vm.isMobile).toBe(true);

    // Simulate desktop viewport
    window.innerWidth = 800;
    window.dispatchEvent(new Event('resize'));
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.isMobile).toBe(false);
  });

  describe('paginationPageNum method', () => {
    let originalCardNum;
    let originalPaginationLength;
    let originalSearchResults;

    beforeEach(() => {
      originalCardNum = wrapper.vm.CardNum;
      originalPaginationLength = wrapper.vm.paginationLength;
      originalSearchResults = wrapper.vm.searchResults;

      // Setup for consistent pagination testing
      wrapper.vm.CardNum = 10; // 10 items per page
      wrapper.vm.paginationLength = 5; // Display 5 page numbers
      // Mock enough search results to have multiple pages
      wrapper.vm.searchResults = Array.from({ length: 100 }, (_, i) => ({ id: `article${i}`, title: `Article ${i}` }));
    });

    afterEach(() => {
      wrapper.vm.CardNum = originalCardNum;
      wrapper.vm.paginationLength = originalPaginationLength;
      wrapper.vm.searchResults = originalSearchResults;
    });

    it('應在currentPage靠近開頭時正確計算頁碼列表', async () => {
      wrapper.vm.currentPage = 1; // totalPage = 10, paginationLength = 5
      // start = max(1, 1 - 2) = 1
      // end = min(10, 1 + 5 - 1) = 5
      expect(wrapper.vm.paginationPageNum).toEqual([1, 2, 3, 4, 5]);

      wrapper.vm.currentPage = 2;
      // start = max(1, 2 - 2) = 1
      // end = min(10, 1 + 5 - 1) = 5
      expect(wrapper.vm.paginationPageNum).toEqual([1, 2, 3, 4, 5]);

      wrapper.vm.currentPage = 3;
      // start = max(1, 3 - 2) = 1
      // end = min(10, 1 + 5 - 1) = 5
      expect(wrapper.vm.paginationPageNum).toEqual([1, 2, 3, 4, 5]);
    });

    it('應在currentPage在中間時正確計算頁碼列表', async () => {
      wrapper.vm.currentPage = 5; // totalPage = 10, paginationLength = 5
      // start = max(1, 5 - 2) = 3
      // end = min(10, 3 + 5 - 1) = 7
      expect(wrapper.vm.paginationPageNum).toEqual([3, 4, 5, 6, 7]);

      wrapper.vm.currentPage = 6;
      // start = max(1, 6 - 2) = 4
      // end = min(10, 4 + 5 - 1) = 8
      expect(wrapper.vm.paginationPageNum).toEqual([4, 5, 6, 7, 8]);
    });

    it('應在currentPage靠近結尾時正確計算頁碼列表', async () => {
      wrapper.vm.currentPage = 8; // totalPage = 10, paginationLength = 5
      // start = max(1, 8 - 2) = 6
      // end = min(10, 6 + 5 - 1) = 10
      // if (end - start + 1 < paginationLength) => (10 - 6 + 1 < 5) => (5 < 5) is false.
      expect(wrapper.vm.paginationPageNum).toEqual([6, 7, 8, 9, 10]);

      wrapper.vm.currentPage = 9;
      // start = max(1, 9 - 2) = 7
      // end = min(10, 7 + 5 - 1) = 10
      // if (end - start + 1 < paginationLength) => (10 - 7 + 1 < 5) => (4 < 5) is true.
      // start = max(1, 10 - 5 + 1) = 6
      expect(wrapper.vm.paginationPageNum).toEqual([6, 7, 8, 9, 10]);

      wrapper.vm.currentPage = 10;
      // start = max(1, 10 - 2) = 8
      // end = min(10, 8 + 5 - 1) = 10
      // if (end - start + 1 < paginationLength) => (10 - 8 + 1 < 5) => (3 < 5) is true.
      // start = max(1, 10 - 5 + 1) = 6
      expect(wrapper.vm.paginationPageNum).toEqual([6, 7, 8, 9, 10]);
    });

    it('應在總頁數小於分頁長度時顯示所有頁碼', async () => {
      wrapper.vm.searchResults = Array.from({ length: 20 }, (_, i) => ({ id: `article${i}`, title: `Article ${i}` })); // 2 pages
      wrapper.vm.CardNum = 10;
      wrapper.vm.paginationLength = 5;
      await wrapper.vm.$nextTick(); // ensure computed updates

      wrapper.vm.currentPage = 1;
      expect(wrapper.vm.totalPage).toBe(2);
      expect(wrapper.vm.paginationPageNum).toEqual([1, 2]);

      wrapper.vm.currentPage = 2;
      expect(wrapper.vm.paginationPageNum).toEqual([1, 2]);
    });
  });
});
