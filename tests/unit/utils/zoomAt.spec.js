import { describe, it, expect } from 'vitest';
import { MAX_SCALE, applyWheelAt } from '@/utils/zoom';

describe('applyWheelAt', () => {
  it('should keep the offset unchanged when zooming at the stage center', () => {
    const view = applyWheelAt({ scale: 1, x: 0, y: 0 }, -100, 0, 0);
    expect([view.x, view.y]).toEqual([0, 0]);
  });

  it('should zoom in and shift the offset away from the cursor so the point under it stays put', () => {
    const view = applyWheelAt({ scale: 1, x: 0, y: 0 }, -100, 100, 50);
    const ratio = view.scale / 1;
    expect(view.scale).toBeGreaterThan(1);
    expect(view.x).toBeCloseTo(100 - 100 * ratio);
    expect(view.y).toBeCloseTo(50 - 50 * ratio);
  });

  it('should not move the offset once the scale is already clamped', () => {
    const view = applyWheelAt({ scale: MAX_SCALE, x: 5, y: 6 }, -100, 100, 100);
    expect([view.scale, view.x, view.y]).toEqual([MAX_SCALE, 5, 6]);
  });
});
