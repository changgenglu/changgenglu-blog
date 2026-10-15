import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ArticleToc from '@/components/ArticleToc.vue';

const items = [
  { id: 'toc-0', text: '安裝' },
  { id: 'toc-1', text: '使用方式' },
];

let targets;
let wrapper;

function addTargets() {
  targets = items.map(({ id }) => {
    const el = document.createElement('h2');
    el.id = id;
    el.scrollIntoView = vi.fn();
    document.body.appendChild(el);
    return el;
  });
}

describe('ArticleToc', () => {
  beforeEach(addTargets);
  afterEach(() => {
    wrapper?.unmount();
    targets.forEach(el => el.remove());
  });

  it('should render one button per item inside a labelled nav', () => {
    wrapper = mount(ArticleToc, { props: { items } });
    expect(wrapper.find('nav').attributes('aria-label')).toBe('本頁章節');
    expect(wrapper.findAll('ul button').map(b => b.text())).toEqual(['安裝', '使用方式']);
  });

  it('should not use href anchors for items', () => {
    wrapper = mount(ArticleToc, { props: { items } });
    expect(wrapper.findAll('a[href]')).toHaveLength(0);
  });

  it('should render item text as plain text instead of html', () => {
    wrapper = mount(ArticleToc, {
      props: { items: [{ id: 'toc-0', text: '<img src=x>' }, items[1]] },
    });
    expect(wrapper.find('ul img').exists()).toBe(false);
  });

  it('should call scrollIntoView on the target heading when an item is clicked', async () => {
    wrapper = mount(ArticleToc, { props: { items } });
    await wrapper.findAll('ul button')[1].trigger('click');
    expect(targets[1].scrollIntoView).toHaveBeenCalledTimes(1);
    expect(targets[0].scrollIntoView).not.toHaveBeenCalled();
  });

  it('should move focus to the target heading without scrolling again', async () => {
    wrapper = mount(ArticleToc, { props: { items } });
    const focus = vi.spyOn(targets[0], 'focus');
    await wrapper.findAll('ul button')[0].trigger('click');
    expect(targets[0].getAttribute('tabindex')).toBe('-1');
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('should emit select with the item id when clicked', async () => {
    wrapper = mount(ArticleToc, { props: { items } });
    await wrapper.findAll('ul button')[0].trigger('click');
    expect(wrapper.emitted('select')[0]).toEqual(['toc-0']);
  });

  it.each([[0], [1]])('should render nothing when there are only %s headings', count => {
    wrapper = mount(ArticleToc, { props: { items: items.slice(0, count) } });
    expect(wrapper.find('nav').exists()).toBe(false);
  });

  describe('collapsed', () => {
    const listHidden = w => {
      const ul = w.find('ul');
      return !ul.exists() || !ul.isVisible();
    };

    it('should hide the list and set aria-expanded false when collapsed', () => {
      wrapper = mount(ArticleToc, { props: { items, collapsed: true }, attachTo: document.body });
      expect(wrapper.find('button[aria-expanded]').attributes('aria-expanded')).toBe('false');
      expect(listHidden(wrapper)).toBe(true);
    });

    it('should expand the list when the heading button is clicked', async () => {
      wrapper = mount(ArticleToc, { props: { items, collapsed: true }, attachTo: document.body });
      await wrapper.find('button[aria-expanded]').trigger('click');
      expect(wrapper.find('button[aria-expanded]').attributes('aria-expanded')).toBe('true');
      expect(listHidden(wrapper)).toBe(false);
    });

    it('should show the list expanded by default', () => {
      wrapper = mount(ArticleToc, { props: { items }, attachTo: document.body });
      expect(listHidden(wrapper)).toBe(false);
    });
  });
});
