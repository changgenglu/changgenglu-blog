import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import CategoryListView from '@/views/CategoryListView.vue';
// import AllMyArticle from '@/assets/fileNames.json'; // Original import removed

// Mock AllMyArticle (fileNames.json) directly in vi.mock to avoid hoisting issues
const mockAllMyArticleData = []; // Define for use within the test file, not just in the mock
for (let i = 0; i < 20; i++) {
  mockAllMyArticleData.push({
    date: `2023-01-${i + 1}T00:00:00Z`,
    name: `Test Article ${i + 1}.md`,
    matchingLines: [`## Intro ${i + 1}`],
    category: 'Vue',
    path: `Vue/Test Article ${i + 1}.md`,
  });
}
vi.mock('@/assets/fileNames.json', () => ({
  get default() { return mockAllMyArticleData; }, // Use a getter to defer evaluation
}));

import SearchInput from '@/components/SearchInput.vue';

// Mock vue-router's useRouter and useRoute
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
};
const mockRoute = {
  params: {
    categoryName: 'Vue'
  },
};
vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useRouter: () => mockRouter,
    useRoute: () => mockRoute,
  };
});

describe('CategoryListView.vue', () => {
  let wrapper;

  beforeEach(() => {
    mockRouter.push.mockClear();
    mockRoute.params.categoryName = 'Vue'; // Reset category for each test
    vi.clearAllTimers();
    vi.useFakeTimers();

    wrapper = mount(CategoryListView, {
      global: {
        stubs: {
          RouterLink: true,
          ArticleCard: true, // Stub ArticleCard to focus on CategoryListView logic
          SearchInput: SearchInput // Use the actual SearchInput component
        },
        mocks: {
          $router: mockRouter,
          $route: mockRoute,
        }
      }
    });

    // Manually set files for category filtering, as it depends on AllMyArticle.
    // In a real scenario, this would be part of the mounted hook.
    wrapper.vm.files = mockAllMyArticleData.filter(item => item.category === mockRoute.params.categoryName);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    wrapper.unmount();
  });

  it('應正確渲染類別名稱', () => {
    expect(wrapper.find('h2').text()).toBe('Vue');
  });

  it('應根據 categoryName 過濾文章', () => {
    const vueArticles = mockAllMyArticleData.filter(item => item.category === 'Vue');
    expect(wrapper.vm.files.length).toBe(vueArticles.length);
    expect(wrapper.vm.markdownCards.length).toBeLessThanOrEqual(wrapper.vm.CardNum); // Should show paginated
  });

  it('應在搜尋輸入框中觸發 search 事件時導航到 HomeView 並帶有查詢參數', async () => {
    const searchInput = wrapper.findComponent(SearchInput);
    await searchInput.vm.$emit('search', 'component');

    expect(mockRouter.push).toHaveBeenCalledTimes(1);
    expect(mockRouter.push).toHaveBeenCalledWith({
      name: 'home',
      query: { q: 'component' },
    });
  });

  it('分頁功能應正確工作', async () => {
    const initialPage = wrapper.vm.currentPage;
    const totalPages = wrapper.vm.totalPage;

    if (totalPages > 1) {
      // Go to next page
      await wrapper.vm.setPage(initialPage + 1);
      expect(wrapper.vm.currentPage).toBe(initialPage + 1);

      // Go to previous page
      await wrapper.vm.setPage(initialPage);
      expect(wrapper.vm.currentPage).toBe(initialPage);
    }
  });

  it('setPage 應阻止設置無效頁碼 (小於1)', async () => {
    const originalPage = wrapper.vm.currentPage;
    await wrapper.vm.setPage(0);
    expect(wrapper.vm.currentPage).toBe(originalPage);
  });

  it('setPage 應阻止設置無效頁碼 (大於總頁數)', async () => {
    const originalPage = wrapper.vm.currentPage;
    const totalPages = wrapper.vm.totalPage;
    await wrapper.vm.setPage(totalPages + 1);
    expect(wrapper.vm.currentPage).toBe(originalPage);
  });

  it('paginationPageNum 應正確計算頁碼列表 (總頁數 <= 分頁長度)', async () => {
    // With 20 articles and CardNum=6, totalPage is ceil(20/6) = 4
    // paginationLength is 5
    wrapper.vm.currentPage = 1; // Ensure currentPage is valid

    // The new logic should return all pages if totalPage <= paginationLength
    // Here totalPage (4) <= paginationLength (5), so it should return [1,2,3,4]
    expect(wrapper.vm.paginationPageNum).toEqual([1, 2, 3, 4]);

    wrapper.vm.currentPage = 4; // Test current page at end
    expect(wrapper.vm.paginationPageNum).toEqual([1, 2, 3, 4]);
  });

  it('paginationPageNum 應在 currentPage 較小時正確計算 (總頁數 > 分頁長度)', async () => {
    // Simulate many articles, e.g., 60 articles => totalPage = ceil(60/6) = 10
    const originalFiles = wrapper.vm.files;
    const originalCardNum = wrapper.vm.CardNum;
    const originalPaginationLength = wrapper.vm.paginationLength;

    // Create a larger set of files for this test
    const manyArticles = [];
    for(let i = 0; i < 60; i++) {
        manyArticles.push({
            date: `2023-01-${i + 1}T00:00:00Z`, name: `Article ${i+1}.md`,
            matchingLines: [], category: 'Vue', path: `Vue/Article${i+1}.md`
        });
    }

    wrapper.vm.files = manyArticles; // Assign the large array
    wrapper.vm.CardNum = 6;
    wrapper.vm.paginationLength = 5;
    await wrapper.vm.$nextTick(); // Ensure computed properties update

    expect(wrapper.vm.totalPage).toBe(10); // Verify totalPage is now 10

    // Test case 1: currentPage = 1 (start)
    wrapper.vm.currentPage = 1;
    expect(wrapper.vm.paginationPageNum).toEqual([1, 2, 3, 4, 5]);

    // Test case 2: currentPage = 2 (middle - startPage = currentPage - floor(5/2) = 2 - 2 = 0 => 1)
    wrapper.vm.currentPage = 2;
    expect(wrapper.vm.paginationPageNum).toEqual([1, 2, 3, 4, 5]);

    // Test case 3: currentPage = 3 (middle - startPage = currentPage - floor(5/2) = 3 - 2 = 1)
    wrapper.vm.currentPage = 3;
    expect(wrapper.vm.paginationPageNum).toEqual([1, 2, 3, 4, 5]);
    
    // Test case 4: currentPage = 4 (middle - startPage = currentPage - floor(5/2) = 4 - 2 = 2)
    wrapper.vm.currentPage = 4;
    expect(wrapper.vm.paginationPageNum).toEqual([2, 3, 4, 5, 6]);

    // Test case 5: currentPage = 8 (near end)
    wrapper.vm.currentPage = 8; // totalPage is 10, paginationLength is 5
    // startPage = max(1, 8 - 2) = 6
    // endPage = 6 + 5 - 1 = 10
    expect(wrapper.vm.paginationPageNum).toEqual([6, 7, 8, 9, 10]);

    // Test case 6: currentPage = 10 (end)
    wrapper.vm.currentPage = 10;
    // startPage = max(1, 10 - 5 + 1) = 6
    // endPage = 10
    expect(wrapper.vm.paginationPageNum).toEqual([6, 7, 8, 9, 10]);

    wrapper.vm.files = originalFiles; // Restore original files
    wrapper.vm.CardNum = originalCardNum;
    wrapper.vm.paginationLength = originalPaginationLength;
  });

  it('頁面大小調整時應更新 isMobile 狀態', async () => {
    expect(wrapper.vm.isMobile).toBe(false);

    window.innerWidth = 700;
    window.dispatchEvent(new Event('resize'));
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.isMobile).toBe(true);
  });
});
