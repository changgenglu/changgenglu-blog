import { describe, it, expect } from 'vitest';
import { parseMarkdown } from '../../../src/utils/markdownParser';

describe('markdownParser', () => {
  it('should parse content with standard TOC tags', () => {
    const rawContent = `
# Title
<!-- TOC -->
- Link 1
- Link 2
<!-- /TOC -->
## Subtitle
Content here.
    `;
    const { content, tocContent } = parseMarkdown(rawContent);
    expect(tocContent).toContain('- Link 1');
    expect(tocContent).toContain('- Link 2');
    expect(content).toContain('# Title');
    expect(content).toContain('## Subtitle');
    expect(content).not.toContain('<!-- TOC -->');
  });

  it('should parse content with irregular TOC tags (spaces)', () => {
    const rawContent = `
# Title
<!--  TOC  -->
- Link 1
<!-- /TOC   -->
Content here.
    `;
    const { content, tocContent } = parseMarkdown(rawContent);
    expect(tocContent).toContain('- Link 1');
    expect(content).toContain('Content here.');
    expect(content).not.toContain('<!--');
  });

  it('should handle content without TOC tags', () => {
    const rawContent = '# Just Content';
    const { content, tocContent } = parseMarkdown(rawContent);
    expect(tocContent).toBe('');
    expect(content).toBe(rawContent);
  });
});
