import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { countUp } from '@/utils/countUp';

// 手動推進的 requestAnimationFrame：每次 tick(ms) 以該時間戳呼叫排隊中的回呼
let queue;
let nextId;
function tick(timestamp) {
  const pending = queue;
  queue = new Map();
  pending.forEach((cb) => cb(timestamp));
}

function stubMotion({ reduce = false } = {}) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: reduce && query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

describe('countUp', () => {
  let raf;
  let caf;

  beforeEach(() => {
    queue = new Map();
    nextId = 1;
    raf = vi.fn((cb) => {
      const id = nextId++;
      queue.set(id, cb);
      return id;
    });
    caf = vi.fn((id) => queue.delete(id));
    vi.stubGlobal('requestAnimationFrame', raf);
    vi.stubGlobal('cancelAnimationFrame', caf);
    stubMotion({ reduce: false });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete window.matchMedia;
  });

  it('should start from 0 and reach the final number at the end of the duration', () => {
    const onUpdate = vi.fn();
    countUp(120, onUpdate, { duration: 1000 });
    tick(0);
    expect(onUpdate.mock.calls[0][0]).toBe(0);
    tick(1000);
    expect(onUpdate).toHaveBeenLastCalledWith(120);
  });

  it('should emit integers that never decrease and never exceed the target', () => {
    const values = [];
    countUp(57, (v) => values.push(v), { duration: 1000 });
    [0, 100, 250, 400, 650, 900, 1000].forEach(tick);
    expect(values.every(Number.isInteger)).toBe(true);
    expect(values.every((v, i) => i === 0 || v >= values[i - 1])).toBe(true);
    expect(Math.max(...values)).toBe(57);
  });

  it('should stop scheduling frames after reaching the final number', () => {
    countUp(10, vi.fn(), { duration: 500 });
    tick(0);
    tick(500);
    expect(queue.size).toBe(0);
  });

  it('should stop updating after cancel is called', () => {
    const onUpdate = vi.fn();
    const cancel = countUp(100, onUpdate, { duration: 1000 });
    tick(0);
    const calls = onUpdate.mock.calls.length;
    cancel();
    expect(caf).toHaveBeenCalled();
    tick(500);
    expect(onUpdate.mock.calls.length).toBe(calls);
  });

  it('should show the final number immediately under prefers-reduced-motion', () => {
    stubMotion({ reduce: true });
    const onUpdate = vi.fn();
    countUp(88, onUpdate, { duration: 1000 });
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith(88);
  });

  it('should not request any animation frame under prefers-reduced-motion', () => {
    stubMotion({ reduce: true });
    countUp(88, vi.fn());
    expect(raf).not.toHaveBeenCalled();
  });

  it('should return a callable cancel function under prefers-reduced-motion', () => {
    stubMotion({ reduce: true });
    const cancel = countUp(5, vi.fn());
    expect(() => cancel()).not.toThrow();
  });

  it('should show the final number immediately when the target is 0', () => {
    const onUpdate = vi.fn();
    countUp(0, onUpdate);
    expect(onUpdate).toHaveBeenLastCalledWith(0);
    expect(raf).not.toHaveBeenCalled();
  });

  it('should show the final number immediately when requestAnimationFrame is unavailable', () => {
    vi.stubGlobal('requestAnimationFrame', undefined);
    const onUpdate = vi.fn();
    expect(() => countUp(42, onUpdate)).not.toThrow();
    expect(onUpdate).toHaveBeenLastCalledWith(42);
  });
});
