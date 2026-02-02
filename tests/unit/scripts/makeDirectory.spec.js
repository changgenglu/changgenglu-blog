import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFileGitDate, scanDirectory, syncExternalFiles, generateFileList } from '../../../makeDirectory.js';

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

  describe('syncExternalFiles error paths', () => {
    it('should log a warning if source directory not found', () => {
      const mockFs = {
        existsSync: vi.fn(p => p !== './prompt_engineering'), // Mock src to not exist
        mkdirSync: vi.fn(),
        readdirSync: vi.fn(),
        copyFileSync: vi.fn()
      };
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      syncExternalFiles({ fs: mockFs });

      expect(mockFs.existsSync).toHaveBeenCalledWith('./prompt_engineering');
      expect(consoleWarnSpy).toHaveBeenCalledWith('Source directory not found: ./prompt_engineering');
      expect(mockFs.copyFileSync).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('should log an error if file syncing fails', () => {
      const mockFs = {
        existsSync: vi.fn().mockReturnValue(true),
        mkdirSync: vi.fn(),
        readdirSync: vi.fn().mockReturnValue(['note.md']),
        copyFileSync: vi.fn().mockImplementation(() => { throw new Error('copy error'); })
      };
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      syncExternalFiles({ fs: mockFs });

      expect(mockFs.copyFileSync).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error syncing external files:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('generateFileList error handling', () => {
    it('should log an error if writing fileNames.json fails', () => {
      const mockFs = {
        existsSync: vi.fn().mockReturnValue(true), // Added for syncExternalFiles
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
        existsSync: vi.fn().mockReturnValue(true), // Added for syncExternalFiles
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
