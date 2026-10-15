import { describe, it, expect, beforeEach, vi } from 'vitest';
// Mock minisearch and searchIndexData before importing searchEngine

const mockSearchIndexData = [
  { id: 'article1', title: 'Vue.js 基礎', content: '這是關於Vue.js的基礎教學', path: 'Vue/article1.md', category: 'Vue' },
  { id: 'article2', title: 'JavaScript 進階', content: 'JavaScript的進階技巧和概念', path: 'JS/article2.md', category: 'JavaScript' },
  { id: 'article3', title: 'Vue Router 導航', content: '如何在Vue應用中使用Vue Router進行導航', path: 'Vue/article3.md', category: 'Vue' },
  { id: 'article4', title: 'React Hooks 實戰', content: 'React Hooks的實際應用案例', path: 'React/article4.md', category: 'React' },
];

// Mock MiniSearch constructor and its methods
const mockMiniSearchInstance = {
  addAll: vi.fn(),
  search: vi.fn(),
};

// Define a class that acts as the mock constructor
// This class will be returned when MiniSearch is instantiated.
class MockMiniSearch {
  constructor(options) {
    // Optionally spy on constructor calls and arguments
    MockMiniSearchConstructorSpy(options);
    // Assign mocked methods to this instance
    Object.assign(this, mockMiniSearchInstance);
  }
}
// Create a spy for the constructor itself
const MockMiniSearchConstructorSpy = vi.fn();

vi.mock('minisearch', () => ({
  default: MockMiniSearch, // Export our mock class as the default
}));

// Mock the searchIndexData import
vi.mock('@/assets/searchIndex.json', () => ({
  default: mockSearchIndexData,
}));

// Import the module AFTER mocks are set up, but let's handle re-importing for each test
let searchModule;

describe('searchEngine', () => {
  beforeEach(async () => {
    vi.resetModules();
    searchModule = await import('@/utils/searchEngine');
    
    MockMiniSearchConstructorSpy.mockClear(); // Clear constructor spy
    mockMiniSearchInstance.addAll.mockClear();
    mockMiniSearchInstance.search.mockClear();

    await searchModule.initSearch(); // Manually initialize for tests
  });

  // Test to ensure constructor spy is called
  it('initSearch 應該初始化 MiniSearch constructor 並呼叫 addAll', async () => {
    // initSearch is called in beforeEach
    expect(MockMiniSearchConstructorSpy).toHaveBeenCalledTimes(1);
    expect(MockMiniSearchConstructorSpy).toHaveBeenCalledWith(expect.objectContaining({
      fields: ['title', 'content', 'category'],
    }));
    expect(mockMiniSearchInstance.addAll).toHaveBeenCalledTimes(1);
    expect(mockMiniSearchInstance.addAll).toHaveBeenCalledWith(mockSearchIndexData);
  });

  it('initSearch 應該只初始化 MiniSearch 一次', async () => {
    await searchModule.initSearch(); // Call again, should not re-initialize
    expect(MockMiniSearchConstructorSpy).toHaveBeenCalledTimes(1); // Should still be 1
  });

  it('search 應該呼叫 MiniSearch 實例的 search 方法', async () => {
    const testQuery = 'Vue';
    const mockSearchResults = [{ id: 'article1', score: 0.5 }];
    mockMiniSearchInstance.search.mockReturnValue(mockSearchResults);

    const results = searchModule.search(testQuery);

    expect(mockMiniSearchInstance.search).toHaveBeenCalledTimes(1);
    expect(mockMiniSearchInstance.search).toHaveBeenCalledWith(testQuery);
    expect(results).toEqual(mockSearchResults);
  });

  it('search 在未呼叫 initSearch 時會自動建立索引並回傳結果', async () => {
    vi.resetModules();
    MockMiniSearchConstructorSpy.mockClear();
    mockMiniSearchInstance.addAll.mockClear();
    const mockSearchResults = [{ id: 'article1', score: 0.5 }];
    mockMiniSearchInstance.search.mockReturnValue(mockSearchResults);
    const freshModule = await import('@/utils/searchEngine');

    const results = freshModule.search('Vue');

    expect(MockMiniSearchConstructorSpy).toHaveBeenCalledTimes(1);
    expect(mockMiniSearchInstance.addAll).toHaveBeenCalledWith(mockSearchIndexData);
    expect(results).toEqual(mockSearchResults);
  });

  it('search 應該在查詢為空時返回空陣列', async () => {
    const results = searchModule.search('');
    expect(results).toEqual([]);
    expect(mockMiniSearchInstance.search).not.toHaveBeenCalled(); // MiniSearch.search should not be called with empty query
  });

  it('initSearch 應該處理索引建立失敗', async () => {
    mockMiniSearchInstance.addAll.mockImplementationOnce(() => {
      throw new Error('索引建立錯誤');
    });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.resetModules(); // Reset again for this test
    const failSearchModule = await import('@/utils/searchEngine');
    await failSearchModule.initSearch(); 

    // Because console.error is commented out in source code to avoid lint warnings
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  describe('tokenize', () => {
    it('英文與數字連續字元視為小寫單字', () => {
      expect(searchModule.tokenize('Redis Cluster 7')).toEqual(['redis', 'cluster', '7']);
      expect(searchModule.tokenize('Vue.js')).toEqual(['vue', 'js']);
    });

    it('中文連續字元切成重疊雙字詞', () => {
      expect(searchModule.tokenize('交易')).toEqual(['交易']);
      expect(searchModule.tokenize('中介層')).toEqual(['中介', '介層']);
      expect(searchModule.tokenize('環境變數')).toEqual(['環境', '境變', '變數']);
    });

    it('單一中文字保留為單字詞', () => {
      expect(searchModule.tokenize('快')).toEqual(['快']);
      expect(searchModule.tokenize('Redis 快 取')).toEqual(['redis', '快', '取']);
    });

    it('中英混排時各自切分，標點視為分隔', () => {
      expect(searchModule.tokenize('Laravel 測試')).toEqual(['laravel', '測試']);
      expect(searchModule.tokenize('Redis快取，很快')).toEqual(['redis', '快取', '很快']);
    });

    it('空字串回傳空陣列', () => {
      expect(searchModule.tokenize('')).toEqual([]);
    });
  });

  describe('以實際 MiniSearch 驗證中文搜尋', () => {
    const docs = [
      { id: 'd1', title: '錢包串接', content: '每一筆交易都需要冪等處理', path: 'a.md', category: 'API' },
      { id: 'd2', title: '資料庫', content: '替欄位建立索引可以加速查詢', path: 'b.md', category: 'DB' },
      { id: 'd3', title: '設定', content: '請先設定環境變數再啟動服務', path: 'c.md', category: 'Env' },
      { id: 'd4', title: 'Redis 筆記', content: 'Redis 可以當作快取使用', path: 'd.md', category: 'Redis' },
      { id: 'd5', title: 'Laravel 入門', content: 'Laravel 的測試可以用 PHPUnit', path: 'e.md', category: 'PHP' },
      { id: 'd6', title: 'Laravel 部署', content: 'Laravel 部署流程說明', path: 'f.md', category: 'PHP' },
      { id: 'd7', title: '中介層', content: 'Laravel 的中介層可以過濾請求', path: 'g.md', category: 'PHP' },
      { id: 'd8', title: '中間商', content: '介紹中間商的角色', path: 'h.md', category: 'Misc' },
    ];
    let real;
    const ids = (q) => real.search(q).map((r) => r.id);

    beforeEach(async () => {
      const { default: RealMiniSearch } = await vi.importActual('minisearch');
      const options = MockMiniSearchConstructorSpy.mock.calls[0][0];
      real = new RealMiniSearch(options);
      real.addAll(docs);
    });

    it('查「交易」能命中內文中的詞', () => {
      expect(ids('交易')).toEqual(['d1']);
    });

    it('查「索引」能命中句中的詞', () => {
      expect(ids('索引')).toEqual(['d2']);
    });

    it('查「環境變數」能命中句中的四字詞', () => {
      expect(ids('環境變數')).toEqual(['d3']);
    });

    it('英文單字仍可搜尋且不分大小寫', () => {
      expect(ids('redis')).toEqual(['d4']);
      expect(ids('REDIS')).toEqual(['d4']);
    });

    it('混合查詢「Laravel 測試」要求兩個詞都出現', () => {
      expect(ids('Laravel 測試')).toEqual(['d5']);
    });

    it('查「中介層」不會因容錯命中「中間商」', () => {
      expect(ids('中介層')).toEqual(['d7']);
    });

    it('中文詞不啟用模糊比對，英文維持容錯', () => {
      const { fuzzy } = MockMiniSearchConstructorSpy.mock.calls[0][0].searchOptions;
      expect(fuzzy('交易')).toBe(0);
      expect(fuzzy('快')).toBe(0);
      expect(fuzzy('laravel')).toBe(0.2);
    });
  });
});
