import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFileGitDate, scanDirectory, syncExternalFiles } from '../../../makeDirectory.js';

describe('makeDirectory.js', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('getFileGitDate', () => {
    it('should return date from git log', () => {
      const mockExec = vi.fn().mockReturnValue('2023-01-01T00:00:00+08:00');
      const mockStat = vi.fn();
      
      const date = getFileGitDate('test.md', { exec: mockExec, stat: mockStat });
      expect(date.toISOString()).toBe('2022-12-31T16:00:00.000Z');
    });

    it('should fallback to fs.stat if git fails', () => {
      const mockExec = vi.fn().mockImplementation(() => { throw new Error('git error'); });
      const mockStat = vi.fn().mockReturnValue({ mtime: new Date('2023-01-02T00:00:00Z') });
      
      const date = getFileGitDate('test.md', { exec: mockExec, stat: mockStat });
      expect(date.toISOString()).toBe('2023-01-02T00:00:00.000Z');
    });
  });

  describe('scanDirectory', () => {
    it('should correctly categorize files', () => {
      const mockFs = {
        readdirSync: vi.fn(),
        statSync: vi.fn(),
        readFileSync: vi.fn()
      };

      mockFs.readdirSync.mockImplementation((dir) => {
        if (dir === 'root') return ['PHP', 'JS', 'misc.md'];
        if (dir.endsWith('PHP')) return ['laravel.md'];
        if (dir.endsWith('JS')) return ['vue.md'];
        return [];
      });
      
      mockFs.statSync.mockImplementation((filePath) => {
        const isDir = !filePath.endsWith('.md');
        return {
          isDirectory: () => isDir,
          mtime: new Date()
        };
      });

      mockFs.readFileSync.mockReturnValue('## Title');

      const mockDeps = {
          exec: vi.fn(),
          stat: mockFs.statSync,
          fs: mockFs
      };
      
      const results = scanDirectory('root', 'root', mockDeps);
      
      expect(results).toHaveLength(3);
      
      const phpFile = results.find(f => f.name === 'laravel.md');
      expect(phpFile.category).toBe('PHP');
      // path.relative might produce backslashes on Windows, but test env is Linux
      expect(phpFile.path).toBe('PHP/laravel.md');
      
      const jsFile = results.find(f => f.name === 'vue.md');
      expect(jsFile.category).toBe('JS');
      
      const miscFile = results.find(f => f.name === 'misc.md');
      expect(miscFile.category).toBe('Uncategorized');
    });
  });

  describe('syncExternalFiles', () => {
    it('should copy md files from src to dest', () => {
      const mockFs = {
        existsSync: vi.fn(),
        mkdirSync: vi.fn(),
        readdirSync: vi.fn(),
        copyFileSync: vi.fn()
      };

      mockFs.existsSync.mockReturnValue(true); 
      mockFs.readdirSync.mockReturnValue(['note.md', 'script.js']);

      syncExternalFiles({ fs: mockFs });

      expect(mockFs.copyFileSync).toHaveBeenCalledTimes(1);
    });
  });

});
