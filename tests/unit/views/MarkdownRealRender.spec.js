import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import Markdown from 'vue3-markdown-it';
import { findMermaidBlocks } from '@/utils/mermaid';

// 其他文章頁測試都以 stub 取代 vue3-markdown-it；這裡用真實輸出確認 mermaid 區塊選擇器仍然命中
describe('vue3-markdown-it 真實輸出', () => {
  it('mermaid 圍欄區塊渲染成 pre > code.language-mermaid 且內容為原始碼', async () => {
    const source = '```mermaid\ngraph TD;\n  A-->B;\n```\n';
    const wrapper = mount(Markdown, { props: { source } });
    await flushPromises();

    const blocks = findMermaidBlocks(wrapper.element);
    expect(blocks).toHaveLength(1);
    expect(wrapper.find('pre > code.language-mermaid').text()).toBe('graph TD;\n  A-->B;');
    wrapper.unmount();
  });
});
