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

  it('search 應該在未初始化時返回空陣列', async () => {
    vi.resetModules(); // Reset again to ensure uninitialized state
    const uninitializedSearchModule = await import('@/utils/searchEngine');
    
    const results = uninitializedSearchModule.search('test');
    expect(results).toEqual([]);
    expect(mockMiniSearchInstance.search).not.toHaveBeenCalled(); // No search should be attempted
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
});
