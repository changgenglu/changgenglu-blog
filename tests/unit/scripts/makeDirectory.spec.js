import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFileGitDate, scanDirectory, generateFileList } from '../../../makeDirectory.js';

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

    it('should run git log with --follow so renamed files keep their history', () => {
      const mockExec = vi.fn().mockReturnValue('2023-01-01T00:00:00+08:00');
      const mockStat = vi.fn();

      getFileGitDate('notes/test.md', { exec: mockExec, stat: mockStat });

      expect(mockExec).toHaveBeenCalledTimes(1);
      expect(mockExec.mock.calls[0][0]).toBe('git log -1 --follow --format=%cI -- "notes/test.md"');
    });

    it('should fallback to fs.stat if git fails', () => {
      const mockExec = vi.fn().mockImplementation(() => { throw new Error('git error'); });
      const mockStat = vi.fn().mockReturnValue({ mtime: new Date('2023-01-02T00:00:00Z') });
      
      const date = getFileGitDate('test.md', { exec: mockExec, stat: mockStat });
      expect(date.toISOString()).toBe('2023-01-02T00:00:00.000Z');
    });

    it('should handle invalid date string from git log gracefully', () => {
      const mockExec = vi.fn().mockReturnValue('invalid date string'); // Invalid date
      const mockStat = vi.fn().mockReturnValue({ mtime: new Date('2023-01-02T00:00:00Z') }); // Fallback date
      
      const date = getFileGitDate('test.md', { exec: mockExec, stat: mockStat });
      expect(date.toISOString()).toBe('2023-01-02T00:00:00.000Z'); // Should use fallback
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
      
      const { fileData, searchIndexData } = scanDirectory('root', 'root', mockDeps); // Destructure return
      
      expect(fileData).toHaveLength(3); // Check fileData length
      expect(searchIndexData).toHaveLength(3); // Check searchIndexData length
      
      const phpFile = fileData.find(f => f.name === 'laravel.md');
      expect(phpFile).toBeDefined();
      expect(phpFile.category).toBe('PHP');
      // path.relative might produce backslashes on Windows, but test env is Linux
      expect(phpFile.path).toBe('PHP/laravel.md');
      
      const jsFile = fileData.find(f => f.name === 'vue.md');
      expect(jsFile).toBeDefined();
      expect(jsFile.category).toBe('JS');
      
      const miscFile = fileData.find(f => f.name === 'misc.md');
      expect(miscFile).toBeDefined();
      expect(miscFile.category).toBe('Uncategorized');

      // Add checks for searchIndexData as well
      const phpSearchIndex = searchIndexData.find(f => f.id === 'PHP/laravel.md');
      expect(phpSearchIndex).toBeDefined();
      expect(phpSearchIndex.title).toBe('laravel');
      expect(phpSearchIndex.content).toBe('Title'); // stripped content
      expect(phpSearchIndex.category).toBe('PHP');
    });
  });

  describe('generateFileList error handling', () => {
    it('should log an error if writing fileNames.json fails', () => {
      const mockFs = {
        readdirSync: vi.fn().mockReturnValue([]), // Simulate empty dir
        statSync: vi.fn().mockReturnValue({ isDirectory: () => false }),
        readFileSync: vi.fn(),
        writeFileSync: vi.fn().mockImplementationOnce(() => { throw new Error('write error'); }) // Make writeFileSync fail first time
      };
      const consoleLogSpy = vi.spyOn(console, 'log'); // Spy on log to ensure "目錄已建立！" is not called
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {}); // Spy on console.error
      
      generateFileList('./public/markdownFiles', './src/assets/fileNames.json', './src/assets/searchIndex.json', { fs: mockFs });

      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).not.toHaveBeenCalledWith('fileNames.json 已建立！');
      expect(consoleErrorSpy).toHaveBeenCalledWith('無法建立目錄或索引：', expect.any(Error));
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should log an error if writing searchIndex.json fails', () => {
      const mockFs = {
        readdirSync: vi.fn().mockReturnValue([]),
        statSync: vi.fn().mockReturnValue({ isDirectory: () => false }),
        readFileSync: vi.fn(),
        writeFileSync: vi.fn()
          .mockImplementationOnce(() => {}) // fileNames.json write succeeds
          .mockImplementationOnce(() => { throw new Error('search index write error'); }) // searchIndex.json write fails
      };
      const consoleLogSpy = vi.spyOn(console, 'log');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      generateFileList('./public/markdownFiles', './src/assets/fileNames.json', './src/assets/searchIndex.json', { fs: mockFs });

      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy).toHaveBeenCalledWith('fileNames.json 已建立！');
      expect(consoleErrorSpy).toHaveBeenCalledWith('無法建立目錄或索引：', expect.any(Error));
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

});
