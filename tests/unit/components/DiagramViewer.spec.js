import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import DiagramViewer from '@/components/DiagramViewer.vue';

// 以 document 查詢，不論元件是否用 Teleport 掛到 body 都成立
const dialog = () => document.querySelector('[role="dialog"]');
const stage = () => document.querySelector('.diagram-viewer__stage');
const content = () => document.querySelector('.diagram-viewer__content');
const closeBtn = () => document.querySelector('button[aria-label="關閉"]');
const resetBtn = () => document.querySelector('button[aria-label="重設縮放"]');

function transformOf() {
  const t = content().style.transform;
  const scale = Number(/scale\(([-\d.]+)\)/.exec(t)[1]);
  const [, x, y] = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(t).map(Number);
  return { scale, x, y };
}

function fire(el, type, props) {
  const ev = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(ev, props);
  el.dispatchEvent(ev);
}

const SVG = '<svg id="d1"><text>hello</text></svg>';
let wrapper;

function mountViewer(props = {}) {
  wrapper = mount(DiagramViewer, { props: { open: true, svg: SVG, ...props }, attachTo: document.body });
  return wrapper;
}

describe('DiagramViewer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.style.overflow = '';
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it('should render nothing when closed', () => {
    mountViewer({ open: false });
    expect(dialog()).toBeNull();
  });

  it('should render a modal dialog when open', () => {
    mountViewer();
    expect(dialog().getAttribute('aria-modal')).toBe('true');
  });

  it('should label the dialog with an existing element that has text', () => {
    mountViewer();
    const label = document.getElementById(dialog().getAttribute('aria-labelledby'));
    expect(label.textContent.trim()).not.toBe('');
  });

  it('should show the given svg inside the dialog', () => {
    mountViewer();
    expect(dialog().querySelector('svg#d1 text').textContent).toBe('hello');
  });

  it('should start at scale 1', () => {
    mountViewer();
    expect(transformOf().scale).toBe(1);
  });

  it('should zoom in on wheel up', async () => {
    mountViewer();
    fire(stage(), 'wheel', { deltaY: -100 });
    await wrapper.vm.$nextTick();
    expect(transformOf().scale).toBeGreaterThan(1);
  });

  it('should zoom out on wheel down', async () => {
    mountViewer();
    fire(stage(), 'wheel', { deltaY: 100 });
    await wrapper.vm.$nextTick();
    expect(transformOf().scale).toBeLessThan(1);
  });

  it('should prevent the page from scrolling on wheel', () => {
    mountViewer();
    const ev = new Event('wheel', { bubbles: true, cancelable: true });
    ev.deltaY = -100;
    stage().dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
  });

  it('should pan by the pointer drag distance', async () => {
    mountViewer();
    fire(stage(), 'pointerdown', { clientX: 100, clientY: 100, pointerId: 1, button: 0 });
    fire(stage(), 'pointermove', { clientX: 130, clientY: 80, pointerId: 1 });
    fire(stage(), 'pointerup', { clientX: 130, clientY: 80, pointerId: 1 });
    await wrapper.vm.$nextTick();
    const { x, y } = transformOf();
    expect([x, y]).toEqual([30, -20]);
  });

  it('should ignore pointer movement when no drag started', async () => {
    mountViewer();
    fire(stage(), 'pointermove', { clientX: 130, clientY: 80, pointerId: 1 });
    await wrapper.vm.$nextTick();
    const { x, y } = transformOf();
    expect([x, y]).toEqual([0, 0]);
  });

  it('should restore scale 1 and zero offset when reset is clicked', async () => {
    mountViewer();
    fire(stage(), 'wheel', { deltaY: -100 });
    fire(stage(), 'pointerdown', { clientX: 0, clientY: 0, pointerId: 1, button: 0 });
    fire(stage(), 'pointermove', { clientX: 40, clientY: 40, pointerId: 1 });
    fire(stage(), 'pointerup', { clientX: 40, clientY: 40, pointerId: 1 });
    await wrapper.vm.$nextTick();
    resetBtn().click();
    await wrapper.vm.$nextTick();
    expect(transformOf()).toEqual({ scale: 1, x: 0, y: 0 });
  });

  it('should emit close when the close button is clicked', () => {
    mountViewer();
    closeBtn().click();
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('should emit close when Escape is pressed', () => {
    mountViewer();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('should not react to Escape while closed', () => {
    mountViewer({ open: false });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(wrapper.emitted('close')).toBeUndefined();
  });

  it('should lock body scroll while open and release it after closing', async () => {
    mountViewer();
    expect(document.body.style.overflow).toBe('hidden');
    await wrapper.setProps({ open: false });
    expect(document.body.style.overflow).toBe('');
  });

  it('should release the body scroll lock when unmounted while open', () => {
    mountViewer();
    wrapper.unmount();
    wrapper = null;
    expect(document.body.style.overflow).toBe('');
  });

  it('should return focus to the element focused before opening', async () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    mountViewer({ open: false });
    await wrapper.setProps({ open: true });
    await wrapper.vm.$nextTick();
    expect(document.activeElement).not.toBe(opener);
    await wrapper.setProps({ open: false });
    await wrapper.vm.$nextTick();
    expect(document.activeElement).toBe(opener);
  });

  it('should move focus into the dialog when it opens', async () => {
    mountViewer({ open: false });
    await wrapper.setProps({ open: true });
    await wrapper.vm.$nextTick();
    expect(dialog().contains(document.activeElement)).toBe(true);
  });

  it('should reset zoom when reopened', async () => {
    mountViewer();
    fire(stage(), 'wheel', { deltaY: -100 });
    await wrapper.setProps({ open: false });
    await wrapper.setProps({ open: true });
    expect(transformOf().scale).toBe(1);
  });
});
