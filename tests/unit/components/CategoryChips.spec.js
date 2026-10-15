import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CategoryChips from '@/components/CategoryChips.vue';
import { ALL } from '@/utils/articleFilter';

const categories = ['Laravel', 'PHP'];
const counts = { Laravel: 12, PHP: 7 };

function build(props = {}) {
  return mount(CategoryChips, {
    props: { categories, modelValue: ALL, counts, ...props },
  });
}

describe('CategoryChips', () => {
  it('should render an all chip followed by one chip per category', () => {
    const buttons = build().findAll('button');
    expect(buttons).toHaveLength(3);
    expect(buttons[0].text()).toContain('全部');
    expect(buttons[1].text()).toContain('Laravel');
    expect(buttons[2].text()).toContain('PHP');
  });

  it('should group the chips with role group', () => {
    expect(build().find('[role="group"]').exists()).toBe(true);
  });

  it('should mark only the selected chip with aria-pressed true', () => {
    const buttons = build({ modelValue: 'PHP' }).findAll('button');
    expect(buttons.map((b) => b.attributes('aria-pressed'))).toEqual(['false', 'false', 'true']);
  });

  it('should mark the all chip as pressed when modelValue is ALL', () => {
    const buttons = build({ modelValue: ALL }).findAll('button');
    expect(buttons[0].attributes('aria-pressed')).toBe('true');
  });

  it('should emit update:modelValue with the category name on click', async () => {
    const wrapper = build();
    await wrapper.findAll('button')[2].trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([['PHP']]);
  });

  it('should emit update:modelValue with ALL when the all chip is clicked', async () => {
    const wrapper = build({ modelValue: 'PHP' });
    await wrapper.findAll('button')[0].trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([[ALL]]);
  });

  it('should show the article count of each category', () => {
    const buttons = build().findAll('button');
    expect(buttons[1].text()).toContain('12');
    expect(buttons[2].text()).toContain('7');
  });
});
