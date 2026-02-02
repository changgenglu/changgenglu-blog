import MiniSearch from 'minisearch';
import searchIndexData from '../assets/searchIndex.json'; // 載入預先生成的索引資料

let miniSearch = null;

// 初始化 MiniSearch
async function initSearch() {
  if (miniSearch) {
    return; // 已經初始化過了
  }

  miniSearch = new MiniSearch({
    fields: ['title', 'content', 'category'], // 搜尋欄位
    storeFields: ['title', 'path', 'category'], // 回傳欄位
    searchOptions: {
      boost: { title: 2, category: 1, content: 1 }, // 標題和分類權重較高
      fuzzy: 0.2, // 容錯率
      prefix: true, // 支援前綴搜尋
      combineWith: 'AND', // 預設為 AND 邏輯
    }
  });

  // 載入資料並建立索引
  try {
    miniSearch.addAll(searchIndexData);
    console.log('MiniSearch 索引已建立完成。');
  } catch (error) {
    console.error('MiniSearch 索引建立失敗:', error);
  }
}

// 執行搜尋
function search(query) {
  if (!miniSearch) {
    console.warn('MiniSearch 尚未初始化。');
    return [];
  }
  if (!query) {
    return [];
  }
  return miniSearch.search(query);
}

// 移除: 立即初始化 (非同步)
// initSearch(); // Removed auto-initialization

export { initSearch, search };
