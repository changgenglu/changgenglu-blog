import { describe, it, expect } from 'vitest';
import { ALL, filterByCategory, listCategories } from '@/utils/articleFilter';

const items = [
  { title: 'a', category: 'PHP' },
  { title: 'b', category: 'Laravel' },
  { title: 'c', category: 'PHP' },
];

describe('articleFilter', () => {
  it('should use an empty string as the ALL sentinel', () => {
    expect(ALL).toBe('');
  });

  it('should return every item when category is ALL', () => {
    expect(filterByCategory(items, ALL)).toEqual(items);
  });

  it('should return only items of the given category', () => {
    expect(filterByCategory(items, 'PHP').map((i) => i.title)).toEqual(['a', 'c']);
  });

  it('should return an empty array for an unknown category', () => {
    expect(filterByCategory(items, 'Nope')).toEqual([]);
  });

  it('should not mutate the input array', () => {
    const copy = JSON.parse(JSON.stringify(items));
    filterByCategory(items, 'PHP');
    expect(items).toEqual(copy);
  });

  it('should list unique categories in sorted order', () => {
    expect(listCategories(items)).toEqual(['Laravel', 'PHP']);
  });

  it('should return an empty list for no items', () => {
    expect(listCategories([])).toEqual([]);
  });
});
