import { describe, it, expect } from 'vitest';
import { MIN_SCALE, MAX_SCALE, initialView, clampScale, applyWheel, applyDrag } from '@/utils/zoom';

describe('zoom', () => {
  it('should start at scale 1 with no offset', () => {
    expect(initialView()).toEqual({ scale: 1, x: 0, y: 0 });
  });

  it('should clamp scale below the minimum up to the minimum', () => {
    expect(clampScale(MIN_SCALE / 10)).toBe(MIN_SCALE);
  });

  it('should clamp scale above the maximum down to the maximum', () => {
    expect(clampScale(MAX_SCALE * 10)).toBe(MAX_SCALE);
  });

  it('should keep a scale inside the range unchanged', () => {
    expect(clampScale(1.5)).toBe(1.5);
  });

  it('should zoom in when the wheel scrolls up (negative deltaY)', () => {
    expect(applyWheel(initialView(), -100).scale).toBeGreaterThan(1);
  });

  it('should zoom out when the wheel scrolls down (positive deltaY)', () => {
    expect(applyWheel(initialView(), 100).scale).toBeLessThan(1);
  });

  it('should never zoom past the maximum however long the wheel keeps turning', () => {
    let view = initialView();
    for (let i = 0; i < 200; i++) view = applyWheel(view, -100);
    expect(view.scale).toBe(MAX_SCALE);
  });

  it('should never zoom below the minimum however long the wheel keeps turning', () => {
    let view = initialView();
    for (let i = 0; i < 200; i++) view = applyWheel(view, 100);
    expect(view.scale).toBe(MIN_SCALE);
  });

  it('should keep the offset when zooming with the wheel', () => {
    const view = applyWheel({ scale: 1, x: 12, y: -7 }, -100);
    expect([view.x, view.y]).toEqual([12, -7]);
  });

  it('should move the offset by the drag distance without changing scale', () => {
    expect(applyDrag({ scale: 2, x: 10, y: 20 }, 5, -8)).toEqual({ scale: 2, x: 15, y: 12 });
  });

  it('should not mutate the view passed in', () => {
    const view = Object.freeze({ scale: 1, x: 0, y: 0 });
    expect(() => { applyWheel(view, -100); applyDrag(view, 1, 1); }).not.toThrow();
  });
});
