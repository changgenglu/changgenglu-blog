import { describe, it, expect, vi, afterEach } from 'vitest';
import { compileMarkdownFiles } from '../../../markdownCompiler';
import fs from 'fs';
import path from 'path';

describe('markdownCompiler', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should compile markdown content and TOC correctly', () => {
    const mockFiles = ['test.md'];
    const mockContent = `
# Title
<!-- TOC -->
- Link 1
- Link 2
<!-- /TOC -->
## Subtitle
Content here.
    `;
    const mockOutputDir = './output';

    // Using spyOn instead of vi.mock for better reliability with Node core modules
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readdir').mockImplementation((path, cb) => cb(null, mockFiles));
    vi.spyOn(fs, 'readFileSync').mockReturnValue(mockContent);
    const writeSpy = vi.spyOn(fs, 'writeFile').mockImplementation((path, data, encoding, cb) => cb(null));
    
    vi.spyOn(path, 'join').mockImplementation((...args) => args.join('/'));
    vi.spyOn(path, 'basename').mockReturnValue('test');
    vi.spyOn(path, 'extname').mockReturnValue('.md');

    compileMarkdownFiles('./input', mockOutputDir);

    expect(writeSpy).toHaveBeenCalled();
    const [filePath, content] = writeSpy.mock.calls[0];
    
    expect(filePath).toContain('test.json');
    
    const jsonContent = JSON.parse(content);
    expect(jsonContent.tocContent).toContain('- Link 1');
    expect(jsonContent.content).toContain('# Title');
    expect(jsonContent.content).toContain('## Subtitle');
    expect(jsonContent.content).not.toContain('<!-- TOC -->');
  });

  it('should handle markdown without TOC tags', () => {
    const mockFiles = ['no-toc.md'];
    const mockContent = '# Just Content';
    
    vi.spyOn(fs, 'readdir').mockImplementation((path, cb) => cb(null, mockFiles));
    vi.spyOn(fs, 'readFileSync').mockReturnValue(mockContent);
    vi.spyOn(path, 'basename').mockReturnValue('no-toc');
    const writeSpy = vi.spyOn(fs, 'writeFile').mockImplementation((path, data, encoding, cb) => cb(null));
    
    compileMarkdownFiles('./input', './output');
    
    const [_, content] = writeSpy.mock.calls[0];
    const jsonContent = JSON.parse(content);
    
    expect(jsonContent.tocContent).toBe('');
    expect(jsonContent.content).toBe(mockContent);
  });
});
