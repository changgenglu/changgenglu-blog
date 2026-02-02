import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import SearchInput from '@/components/SearchInput.vue';

describe('SearchInput.vue', () => {
  let wrapper;

  beforeEach(() => {
    vi.useFakeTimers(); // Ensure fake timers are always used before mounting

    wrapper = mount(SearchInput, {
      props: {
        modelValue: '',
        placeholder: '測試搜尋...',
        debounceTime: 100 // Use a shorter debounce time for tests
      }
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers(); // Clear any pending timers
    vi.useRealTimers(); // Restore real timers
    wrapper.unmount();
  });

  it('應正確渲染輸入框和 placeholder', () => {
    expect(wrapper.find('input').exists()).toBe(true);
    expect(wrapper.find('input').attributes('placeholder')).toBe('測試搜尋...');
  });

  it('modelValue 屬性應正確設置輸入框的值', async () => {
    await wrapper.setProps({ modelValue: 'initial query' });
    expect(wrapper.find('input').element.value).toBe('initial query');
  });

  it('輸入時應發出 update:modelValue 事件', async () => {
    const input = wrapper.find('input');
    await input.setValue('test query');
    expect(wrapper.emitted()['update:modelValue']).toBeTruthy();
    expect(wrapper.emitted()['update:modelValue'][0][0]).toBe('test query');
  });

  it('search 事件應在 debounceTime 後發出', async () => {
    const input = wrapper.find('input');
    await input.setValue('test');
    expect(wrapper.emitted().search).toBeFalsy(); // Event not emitted immediately

    vi.advanceTimersByTime(wrapper.props().debounceTime - 1); // Advance almost enough
    expect(wrapper.emitted().search).toBeFalsy();

    vi.advanceTimersByTime(1); // Advance the rest
    expect(wrapper.emitted().search).toBeTruthy();
    expect(wrapper.emitted().search[0][0]).toBe('test');
  });

  it('連續輸入應重置 debounce 計時器', async () => {
    const input = wrapper.find('input');
    await input.setValue('t');
    vi.advanceTimersByTime(50); // Less than debounceTime
    await input.setValue('te');
    vi.advanceTimersByTime(50); // Less than debounceTime
    await input.setValue('tes');

    expect(wrapper.emitted().search).toBeFalsy();

    vi.advanceTimersByTime(wrapper.props().debounceTime); // Now it should emit
    expect(wrapper.emitted().search).toBeTruthy();
    expect(wrapper.emitted().search[0][0]).toBe('tes');
    expect(wrapper.emitted().search.length).toBe(1); // Only one search event
  });

  it('組件銷毀時應取消 debounce 計時器', async () => {
    const input = wrapper.find('input');
    await input.setValue('query');
    vi.advanceTimersByTime(50); // Start debounce
    
    // Test the `cancel` method of the debounced function.
    // The `debounce` function from `lodash` returns a function with a `cancel` method.
    // We need to spy on *that specific* cancel method.
    const debouncedFn = wrapper.vm.debouncedEmitSearch;
    const spy = vi.spyOn(debouncedFn, 'cancel');

    wrapper.unmount();
    expect(spy).toHaveBeenCalled();
  });
});
