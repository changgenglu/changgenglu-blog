// 「全部」以空字串表示，避免與真實分類名稱撞名
export const ALL = '';

export function filterByCategory(items, category) {
  return category === ALL ? items : items.filter((i) => i.category === category);
}

export function listCategories(items) {
  return Array.from(new Set(items.map((i) => i.category))).sort();
}
