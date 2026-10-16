import { describe, it, expect } from 'vitest';
import router from '@/router';

describe('router', () => {
  it('should keep exactly the three public route paths', () => {
    expect(router.getRoutes().map((r) => r.path).sort()).toEqual(
      ['/', '/category/:categoryName', '/:title(.*)'].sort()
    );
  });

  it('should keep hash-based URLs so existing links keep working', () => {
    expect(router.resolve('/category/PHP').href).toBe('#/category/PHP');
  });

  it('should restore the saved scroll position when going back', () => {
    const saved = { left: 0, top: 480 };
    expect(router.options.scrollBehavior({}, {}, saved)).toBe(saved);
  });

  it('should scroll to the top on a fresh navigation', () => {
    expect(router.options.scrollBehavior({}, {}, null)).toEqual({ top: 0 });
  });

  it('should keep the scroll position when only the query changes on the same path', () => {
    expect(router.options.scrollBehavior({ path: '/' }, { path: '/' }, null)).toBe(false);
  });

  it('should scroll to the top when the path changes', () => {
    expect(router.options.scrollBehavior({ path: '/a' }, { path: '/' }, null)).toEqual({ top: 0 });
  });
});
