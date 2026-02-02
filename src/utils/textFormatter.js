/**
 * 移除 Markdown 語法，僅保留純文字。
 * @param {string} markdown - 原始 Markdown 字串。
 * @returns {string} - 去除 Markdown 語法後的純文字字串。
 */
export function stripMarkdown(markdown) {
  if (!markdown) return "";
  let stripped = markdown;

  // 1. 移除程式碼區塊
  stripped = stripped.replace(/```[\s\S]*?```/g, " ");

  // 2. 移除連結並保留文字，替換為文字本身並以空格分隔
  stripped = stripped.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // 3. 移除 HTML 標籤，替換為空格以保持詞語間隔
  stripped = stripped.replace(/<[^>]+>/g, " ");

  // 4. 移除粗體和斜體標記
  stripped = stripped.replace(/(\*\*|__)(.*?)\1/g, "$2");
  stripped = stripped.replace(/(\*|_)(.*?)\1/g, "$2");

  // 5. 移除標題符號
  stripped = stripped.replace(/#+\s/g, " ");

  // 6. 將所有換行替換為空格
  stripped = stripped.replace(/\n/g, " ");

  // 7. 合併多餘的空白並修剪
  stripped = stripped.replace(/\s+/g, ' ').trim();

  return stripped;
}

/**
 * 安全地高亮文本中的關鍵字。
 * 避免 XSS 攻擊，對原始文本進行 HTML 實體編碼後再插入高亮標籤。
 * @param {string} text - 原始文本。
 * @param {string} query - 搜尋關鍵字。
 * @returns {string} - 包含高亮標籤的 HTML 字串。
 */
export function highlightMatch(text, query) {
  // 1. 對整個文本進行 HTML 實體編碼，防止 XSS
  const escapedText = text.replace(/[&<>'"']/g, function(match) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;'
    }[match];
  });

  if (!query) return escapedText; // 如果沒有查詢關鍵字，直接返回轉義後的文本

  // 2. 創建正則表達式，用於匹配關鍵字（不區分大小寫）
  //    關鍵字本身可能包含需要轉義的 HTML 特殊字符，所以在使用前先轉義查詢
  const escapedQuery = query.replace(/[&<>'"']/g, function(match) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;'
    }[match];
  });
  const regex = new RegExp(`(${escapedQuery.replace(/[.*+?^${}()|[\\]/g, '\\$&')})`, 'gi');

  // 3. 替換匹配到的關鍵字，並包裹高亮標籤
  return escapedText.replace(regex, '<span class="search-highlight">$&</span>');
}
