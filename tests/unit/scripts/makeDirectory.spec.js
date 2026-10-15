import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFileGitDate, scanDirectory, generateFileList } from '../../../makeDirectory.js';

describe('makeDirectory.js', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('getFileGitDate', () => {
    const mockStat = () => vi.fn().mockReturnValue({ mtime: new Date('2023-01-02T00:00:00Z') });
    // 模擬 `git log --format=%x00%cI --name-status` 的輸出：每筆提交以 NUL 開頭，日期後空一行再接狀態列
    const logOutput = (...commits) =>
      commits.map(([date, status]) => `\0${date}\n\n${status}\n`).join('');

    it('should return date from git log', () => {
      const mockExec = vi.fn().mockReturnValue(logOutput(['2023-01-01T00:00:00+08:00', 'M\ttest.md']));

      const date = getFileGitDate('test.md', { exec: mockExec, stat: mockStat() });
      expect(date.toISOString()).toBe('2022-12-31T16:00:00.000Z');
    });

    it('should run git log with --follow and --name-status so renames can be detected', () => {
      const mockExec = vi.fn().mockReturnValue(logOutput(['2023-01-01T00:00:00+08:00', 'M\ttest.md']));

      getFileGitDate('notes/test.md', { exec: mockExec, stat: mockStat() });

      expect(mockExec).toHaveBeenCalledTimes(1);
      expect(mockExec.mock.calls[0][0]).toBe(
        'git log --follow --format=%x00%cI --name-status -- "notes/test.md"'
      );
    });

    it('should skip pure rename (R100) commits and use the last content change', () => {
      const mockExec = vi.fn().mockReturnValue(
        logOutput(
          ['2026-10-15T10:00:00+08:00', 'R100\told/test.md\tnew/test.md'],
          ['2026-01-26T13:34:32+08:00', 'A\told/test.md']
        )
      );

      const date = getFileGitDate('new/test.md', { exec: mockExec, stat: mockStat() });
      expect(date.toISOString()).toBe(new Date('2026-01-26T13:34:32+08:00').toISOString());
    });

    it('should skip pure copy (C100) commits too', () => {
      const mockExec = vi.fn().mockReturnValue(
        logOutput(
          ['2026-10-15T10:00:00+08:00', 'R100\tb/test.md\tc/test.md'],
          ['2026-03-01T09:00:00+08:00', 'C100\ta/test.md\tb/test.md'],
          ['2026-01-26T13:34:32+08:00', 'A\ta/test.md']
        )
      );

      const date = getFileGitDate('c/test.md', { exec: mockExec, stat: mockStat() });
      expect(date.toISOString()).toBe(new Date('2026-01-26T13:34:32+08:00').toISOString());
    });

    it('should keep a rename that also edited content (R094)', () => {
      const mockExec = vi.fn().mockReturnValue(
        logOutput(
          ['2026-10-15T10:00:00+08:00', 'R094\told/test.md\tnew/test.md'],
          ['2026-01-26T13:34:32+08:00', 'A\told/test.md']
        )
      );

      const date = getFileGitDate('new/test.md', { exec: mockExec, stat: mockStat() });
      expect(date.toISOString()).toBe(new Date('2026-10-15T10:00:00+08:00').toISOString());
    });

    it('should keep a plain modification (M) as the newest content change', () => {
      const mockExec = vi.fn().mockReturnValue(
        logOutput(
          ['2026-05-01T00:00:00+08:00', 'M\ttest.md'],
          ['2026-01-26T13:34:32+08:00', 'A\ttest.md']
        )
      );

      const date = getFileGitDate('test.md', { exec: mockExec, stat: mockStat() });
      expect(date.toISOString()).toBe(new Date('2026-05-01T00:00:00+08:00').toISOString());
    });

    it('should fall back to the newest commit when every commit is a pure rename', () => {
      const mockExec = vi.fn().mockReturnValue(
        logOutput(
          ['2026-10-15T10:00:00+08:00', 'R100\tb/test.md\tc/test.md'],
          ['2026-03-01T09:00:00+08:00', 'R100\ta/test.md\tb/test.md']
        )
      );

      const date = getFileGitDate('c/test.md', { exec: mockExec, stat: mockStat() });
      expect(date.toISOString()).toBe(new Date('2026-10-15T10:00:00+08:00').toISOString());
    });

    it('should fallback to fs.stat when git output is empty', () => {
      const mockExec = vi.fn().mockReturnValue('');

      const date = getFileGitDate('test.md', { exec: mockExec, stat: mockStat() });
      expect(date.toISOString()).toBe('2023-01-02T00:00:00.000Z');
    });

    it('should fallback to fs.stat if git fails', () => {
      const mockExec = vi.fn().mockImplementation(() => { throw new Error('git error'); });

      const date = getFileGitDate('test.md', { exec: mockExec, stat: mockStat() });
      expect(date.toISOString()).toBe('2023-01-02T00:00:00.000Z');
    });

    it('should handle invalid date string from git log gracefully', () => {
      const mockExec = vi.fn().mockReturnValue(logOutput(['invalid date string', 'M\ttest.md']));

      const date = getFileGitDate('test.md', { exec: mockExec, stat: mockStat() });
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
