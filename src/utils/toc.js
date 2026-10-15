// id 用順序編號而非標題文字：標題可能重複或含中文，轉成 slug 容易衝突
export function buildToc(texts) {
  return texts.map((text, i) => ({ id: `toc-${i}`, text: text.trim() }));
}

export const shouldShowToc = items => items.length >= 2;

/**
 * 從渲染後的 DOM 取 h2 並寫入 id。以 DOM 為準而非原始 Markdown，
 * 程式碼區塊裡的 `## 註解` 才不會被當成章節。
 */
export function extractHeadings(rootEl) {
  const headings = Array.from(rootEl.querySelectorAll('h2'));
  const items = buildToc(headings.map(h => h.textContent));
  headings.forEach((h, i) => { h.id = items[i].id; });
  return items;
}
