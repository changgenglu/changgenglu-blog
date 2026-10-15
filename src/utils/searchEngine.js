import MiniSearch from 'minisearch';
import searchIndexData from '../assets/searchIndex.json'; // 載入預先生成的索引資料

let miniSearch = null;

const CJK = '\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}\\p{Script=Hangul}';
// 一段連續中日韓文字，或一段連續的其他字母／數字
const RUN_PATTERN = new RegExp(`[${CJK}]+|(?:(?![${CJK}])[\\p{L}\\p{N}])+`, 'gu');
const CJK_PATTERN = new RegExp(`^[${CJK}]`, 'u');

// 中文沒有空格，預設斷詞會把整段文字當成一個詞，導致查詢詞出現在句中時搜不到。
// 改成重疊雙字詞（bigram），索引與查詢共用同一個函式，兩邊切法才會一致。
function tokenize(text) {
  const tokens = [];
  for (const run of String(text).match(RUN_PATTERN) || []) {
    if (!CJK_PATTERN.test(run)) {
      tokens.push(run.toLowerCase());
      continue;
    }
    const chars = Array.from(run);
    if (chars.length === 1) {
      tokens.push(run);
      continue;
    }
    for (let i = 0; i < chars.length - 1; i++) {
      tokens.push(chars[i] + chars[i + 1]);
    }
  }
  return tokens;
}

// 雙字詞容錯後容易誤配到不相干的詞，因此中文不模糊比對；英文維持原本 0.2
function fuzzyFor(term) {
  return CJK_PATTERN.test(term) ? 0 : 0.2;
}

// 初始化 MiniSearch（同步建立；app 內沒有任何地方會預先呼叫，由 search() 首次使用時觸發）
function ensureInitialized() {
  if (miniSearch) {
    return; // 已經初始化過了
  }

  miniSearch = new MiniSearch({
    fields: ['title', 'content', 'category'], // 搜尋欄位
    storeFields: ['title', 'path', 'category'], // 回傳欄位
    tokenize,
    searchOptions: {
      boost: { title: 2, category: 1, content: 1 }, // 標題和分類權重較高
      tokenize,
      fuzzy: fuzzyFor, // 容錯率（中文不啟用）
      prefix: true, // 支援前綴搜尋
      combineWith: 'AND', // 預設為 AND 邏輯
    }
  });

  // 載入資料並建立索引
  try {
    miniSearch.addAll(searchIndexData);
    // console.log('MiniSearch 索引已建立完成。');
  } catch (error) {
    // console.error('MiniSearch 索引建立失敗:', error);
  }
}

async function initSearch() {
  ensureInitialized();
}

// 執行搜尋
function search(query) {
  if (!query) {
    return [];
  }
  ensureInitialized();
  return miniSearch.search(query);
}

export { initSearch, search, tokenize };
