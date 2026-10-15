import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { useReveal, shouldAnimate, prefersReducedMotion } from '@/composables/useReveal';

// 假的 IntersectionObserver：記錄實體，讓測試手動觸發「進入視窗」
let instances;
class FakeIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observed = new Set();
    this.observe = vi.fn((el) => this.observed.add(el));
    this.unobserve = vi.fn((el) => this.observed.delete(el));
    this.disconnect = vi.fn(() => this.observed.clear());
    instances.push(this);
  }
  trigger(el, isIntersecting = true) {
    this.callback([{ target: el, isIntersecting }], this);
  }
}

function stubMotion({ reduce = false } = {}) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: reduce && query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

function mountWithReveals(count = 2, options) {
  const Comp = defineComponent({
    setup() {
      useReveal(options);
      return () =>
        h(
          'div',
          Array.from({ length: count }, (_, i) =>
            h('p', { 'data-reveal': '', class: `item-${i}` }, `item ${i}`)
          )
        );
    },
  });
  return mount(Comp, { attachTo: document.body });
}

describe('useReveal', () => {
  beforeEach(() => {
    instances = [];
    window.IntersectionObserver = FakeIntersectionObserver;
    stubMotion({ reduce: false });
  });

  afterEach(() => {
    delete window.IntersectionObserver;
    delete window.matchMedia;
    document.body.innerHTML = '';
  });

  describe('shouldAnimate', () => {
    it('should return true when motion is allowed and IntersectionObserver exists', () => {
      expect(shouldAnimate()).toBe(true);
    });

    it('should return false when prefers-reduced-motion is reduce', () => {
      stubMotion({ reduce: true });
      expect(shouldAnimate()).toBe(false);
    });

    it('should return false when IntersectionObserver is unavailable', () => {
      delete window.IntersectionObserver;
      expect(shouldAnimate()).toBe(false);
    });

    it('should still evaluate when matchMedia is unavailable', () => {
      delete window.matchMedia;
      expect(shouldAnimate()).toBe(true);
    });
  });

  describe('prefersReducedMotion', () => {
    it('should be true only when the reduce query matches', () => {
      expect(prefersReducedMotion()).toBe(false);
      stubMotion({ reduce: true });
      expect(prefersReducedMotion()).toBe(true);
    });

    it('should be false when matchMedia is unavailable', () => {
      delete window.matchMedia;
      expect(prefersReducedMotion()).toBe(false);
    });
  });

  describe('when animation is allowed', () => {
    it('should observe every [data-reveal] element after mount without revealing it', () => {
      const wrapper = mountWithReveals(2);
      expect(instances).toHaveLength(1);
      expect(instances[0].observed.size).toBe(2);
      expect(wrapper.findAll('.is-revealed')).toHaveLength(0);
    });

    it('should add is-revealed when the element enters the viewport', () => {
      const wrapper = mountWithReveals(2);
      const el = wrapper.find('.item-0').element;
      instances[0].trigger(el, true);
      expect(el.classList.contains('is-revealed')).toBe(true);
      expect(wrapper.find('.item-1').classes()).not.toContain('is-revealed');
    });

    it('should not reveal an element that is still outside the viewport', () => {
      const wrapper = mountWithReveals(1);
      const el = wrapper.find('.item-0').element;
      instances[0].trigger(el, false);
      expect(el.classList.contains('is-revealed')).toBe(false);
      expect(instances[0].unobserve).not.toHaveBeenCalled();
    });

    it('should unobserve the element once revealed so it fires only once', () => {
      const wrapper = mountWithReveals(1);
      const el = wrapper.find('.item-0').element;
      instances[0].trigger(el, true);
      expect(instances[0].unobserve).toHaveBeenCalledWith(el);
      expect(instances[0].observed.has(el)).toBe(false);
    });

    it('should honour a custom selector and revealed class', () => {
      const Comp = defineComponent({
        setup() {
          useReveal({ selector: '.fade', revealedClass: 'shown' });
          return () => h('div', [h('span', { class: 'fade' }), h('span', { 'data-reveal': '' })]);
        },
      });
      const wrapper = mount(Comp, { attachTo: document.body });
      expect(instances[0].observed.size).toBe(1);
      const el = wrapper.find('.fade').element;
      instances[0].trigger(el, true);
      expect(el.classList.contains('shown')).toBe(true);
    });

    it('should disconnect the observer when the component unmounts', () => {
      const wrapper = mountWithReveals(2);
      wrapper.unmount();
      expect(instances[0].disconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('when prefers-reduced-motion is reduce', () => {
    beforeEach(() => stubMotion({ reduce: true }));

    it('should not create an IntersectionObserver', () => {
      mountWithReveals(2);
      expect(instances).toHaveLength(0);
    });

    it('should mark every [data-reveal] element as revealed immediately', () => {
      const wrapper = mountWithReveals(3);
      expect(wrapper.findAll('.is-revealed')).toHaveLength(3);
    });

    it('should unmount without error', () => {
      const wrapper = mountWithReveals(1);
      expect(() => wrapper.unmount()).not.toThrow();
    });
  });

  describe('when IntersectionObserver is unavailable', () => {
    beforeEach(() => {
      delete window.IntersectionObserver;
    });

    it('should reveal every [data-reveal] element immediately without throwing', () => {
      let wrapper;
      expect(() => {
        wrapper = mountWithReveals(2);
      }).not.toThrow();
      expect(wrapper.findAll('.is-revealed')).toHaveLength(2);
    });

    it('should unmount without error', () => {
      const wrapper = mountWithReveals(1);
      expect(() => wrapper.unmount()).not.toThrow();
    });
  });
});
