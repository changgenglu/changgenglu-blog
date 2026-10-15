import { onMounted, onBeforeUnmount } from 'vue';

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion() {
  return typeof window.matchMedia === 'function' && window.matchMedia(REDUCE_QUERY).matches;
}

export function shouldAnimate() {
  if (prefersReducedMotion()) return false;
  return typeof window.IntersectionObserver === 'function';
}

// 只處理掛載當下已存在的元素；之後才由 v-for／v-if 產生的元素不會被觀察，不要在它們上面加 data-reveal
export function useReveal({ selector = '[data-reveal]', revealedClass = 'is-revealed' } = {}) {
  let observer = null;

  onMounted(() => {
    const elements = Array.from(document.querySelectorAll(selector));
    if (!shouldAnimate()) {
      elements.forEach((el) => el.classList.add(revealedClass));
      return;
    }
    observer = new window.IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add(revealedClass);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.1 }
    );
    elements.forEach((el) => observer.observe(el));
  });

  onBeforeUnmount(() => {
    if (observer) observer.disconnect();
    observer = null;
  });
}
