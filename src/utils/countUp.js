import { prefersReducedMotion } from '@/composables/useReveal';

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

// 回傳 cancel；減少動態、目標為 0 或沒有 rAF 時同步給終值
export function countUp(to, onUpdate, { duration = 1200 } = {}) {
  if (prefersReducedMotion() || !to || typeof requestAnimationFrame !== 'function') {
    onUpdate(to);
    return () => {};
  }
  let start = null;
  let id = null;
  let cancelled = false;
  const step = (now) => {
    if (cancelled) return;
    if (start === null) start = now;
    const t = Math.min((now - start) / duration, 1);
    onUpdate(t >= 1 ? to : Math.floor(to * easeOut(t)));
    id = t >= 1 ? null : requestAnimationFrame(step);
  };
  id = requestAnimationFrame(step);
  return () => {
    cancelled = true;
    if (id !== null) cancelAnimationFrame(id);
  };
}
