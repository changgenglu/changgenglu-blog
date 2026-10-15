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
});
