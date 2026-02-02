import { describe, it, expect } from 'vitest';
import { stripMarkdown, highlightMatch } from '@/utils/textFormatter';

describe('textFormatter', () => {
  describe('stripMarkdown', () => {
    it('應正確移除 Markdown 標題', () => {
      const markdown = '# 標題1\n## 標題2\n### 標題3';
      expect(stripMarkdown(markdown)).toBe('標題1 標題2 標題3');
    });

    it('應正確移除程式碼區塊', () => {
      const markdown = '這是文字\n```javascript\nconsole.log("hello");\n```\n更多文字';
      expect(stripMarkdown(markdown)).toBe('這是文字 更多文字');
    });

    it('應正確移除粗體和斜體', () => {
      const markdown = '這是 **粗體** 和 *斜體* 文字';
      expect(stripMarkdown(markdown)).toBe('這是 粗體 和 斜體 文字');
    });

    it('應正確移除連結並保留文字', () => {
      const markdown = '這是一個 [連結文字](http://example.com)';
      expect(stripMarkdown(markdown)).toBe('這是一個 連結文字');
    });

    it('應正確移除 HTML 標籤', () => {
      const markdown = '<div>HTML</div><p>段落</p>';
      expect(stripMarkdown(markdown)).toBe('HTML 段落');
    });

    it('應合併多餘的空白', () => {
      const markdown = '這是    很多    空白';
      expect(stripMarkdown(markdown)).toBe('這是 很多 空白');
    });

    it('應處理多種 Markdown 語法的混合', () => {
      const markdown = '# 標題\n這是一個 **粗體** 連結 [範例](http://example.com)。\n```python\nprint("Hello")\n```\n完畢。';
      expect(stripMarkdown(markdown)).toBe('標題 這是一個 粗體 連結 範例。 完畢。');
    });

    it('應處理空字串', () => {
      expect(stripMarkdown('')).toBe('');
    });

    it('應處理 undefined 輸入', () => {
      expect(stripMarkdown(undefined)).toBe('');
    });
  });

  describe('highlightMatch', () => {
    it('應在高亮關鍵字之前對文本進行 HTML 實體編碼', () => {
      const text = '這是一個 <script>alert("XSS")</script> 測試。';
      const query = 'script';
      const expected = '這是一個 &lt;<span class="search-highlight">script</span>&gt;alert(&quot;XSS&quot;)&lt;/<span class="search-highlight">script</span>&gt; 測試。';
      expect(highlightMatch(text, query)).toBe(expected);
    });

    it('應正確高亮文本中的單個關鍵字', () => {
      const text = '這是搜尋關鍵字範例。';
      const query = '關鍵字';
      expect(highlightMatch(text, query)).toBe('這是搜尋<span class="search-highlight">關鍵字</span>範例。');
    });

    it('應正確高亮文本中的多個關鍵字', () => {
      const text = '關鍵字1和關鍵字2，關鍵字1再次出現。';
      const query = '關鍵字1';
      expect(highlightMatch(text, query)).toBe('<span class="search-highlight">關鍵字1</span>和關鍵字2，<span class="search-highlight">關鍵字1</span>再次出現。');
    });

    it('應不區分大小寫地高亮關鍵字', () => {
      const text = 'JavaScript 是一種語言。Javascript 很棒。';
      const query = 'javascript';
      expect(highlightMatch(text, query)).toBe('<span class="search-highlight">JavaScript</span> 是一種語言。<span class="search-highlight">Javascript</span> 很棒。');
    });

    it('如果沒有查詢關鍵字，應返回原始文本', () => {
      const text = '原始文本。';
      const query = '';
      expect(highlightMatch(text, query)).toBe('原始文本。');
    });

    it('如果文本為空，應返回空字串', () => {
      const text = '';
      const query = 'foo';
      expect(highlightMatch(text, query)).toBe('');
    });

    it('應處理包含特殊正規表達式字符的查詢', () => {
      const text = '這個詞語是 foo.bar 嗎？';
      const query = 'foo.bar';
      expect(highlightMatch(text, query)).toBe('這個詞語是 <span class="search-highlight">foo.bar</span> 嗎？');
    });

    it('應正確處理所有 HTML 特殊字符的實體編碼', () => {
      const text = `& " ' < >`;
      const query = ''; // No query, just test escaping
      const expected = `&amp; &quot; &apos; &lt; &gt;`;
      expect(highlightMatch(text, query)).toBe(expected);
    });

    it('應正確處理包含特殊字符的關鍵字高亮', () => {
        const text = `這個 & 查詢包含 "引用" 和 '單引號'。`; // Original text
        const query = `&`;
        const expected = `這個 <span class="search-highlight">&amp;</span> 查詢包含 &quot;引用&quot; 和 &apos;單引號&apos;。`;
        expect(highlightMatch(text, query)).toBe(expected);

        const query2 = `"引用"`;
        const expected2 = `這個 &amp; 查詢包含 <span class="search-highlight">&quot;引用&quot;</span> 和 &apos;單引號&apos;。`;
        expect(highlightMatch(text, query2)).toBe(expected2);

        const query3 = `'單引號'`;
        const expected3 = `這個 &amp; 查詢包含 &quot;引用&quot; 和 <span class="search-highlight">&apos;單引號&apos;</span>。`;
        expect(highlightMatch(text, query3)).toBe(expected3);
    });
  });
});
