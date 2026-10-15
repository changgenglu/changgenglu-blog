import MiniSearch from 'minisearch';

let miniSearch = null;
let initPromise = null;

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

// 索引約 900 KiB，靜態 import 會被打進主 bundle 拖慢首頁；
// 改成首次搜尋才動態載入，webpack 會把它切成獨立 chunk。
// 並行的首次呼叫共用同一個 promise，載入失敗時清掉，下次搜尋可重試。
function ensureInitialized() {
  if (!initPromise) {
    initPromise = import('../assets/searchIndex.json')
      .then((module) => {
        const instance = new MiniSearch({
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
        try {
          instance.addAll(module.default);
        } catch (error) {
          // 索引建立失敗時保留空索引，搜尋回傳空結果
        }
        miniSearch = instance;
      })
      .catch((error) => {
        initPromise = null;
        throw error;
      });
  }
  return initPromise;
}

async function initSearch() {
  await ensureInitialized();
}

// 執行搜尋（首次呼叫會先下載索引）
async function search(query) {
  if (!query) {
    return [];
  }
  await ensureInitialized();
  return miniSearch.search(query);
}

export { initSearch, search, tokenize };
