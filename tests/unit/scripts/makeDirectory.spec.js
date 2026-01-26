import { describe, it, expect, vi } from 'vitest';
import { getFileGitDate } from '../../../makeDirectory';

describe('getFileGitDate', () => {
  it('should return git commit date when git command succeeds', () => {
    const mockDateStr = '2023-01-01T00:00:00.000Z';
    const mockExec = vi.fn().mockReturnValue(mockDateStr);
    const mockStat = vi.fn();

    const date = getFileGitDate('test.md', { exec: mockExec, stat: mockStat });
    
    expect(date).toBeInstanceOf(Date);
    expect(date.toISOString()).toBe(mockDateStr);
    expect(mockExec).toHaveBeenCalledWith(
      expect.stringContaining('git log -1'),
      expect.anything()
    );
    expect(mockStat).not.toHaveBeenCalled();
  });

  it('should fallback to mtime when git command fails', () => {
    const mockExec = vi.fn().mockImplementation(() => {
      throw new Error('Git error');
    });

    const mockMtime = new Date('2022-01-01T00:00:00.000Z');
    const mockStat = vi.fn().mockReturnValue({ mtime: mockMtime });

    const date = getFileGitDate('test.md', { exec: mockExec, stat: mockStat });

    expect(date).toBeInstanceOf(Date);
    expect(date.toISOString()).toBe(mockMtime.toISOString());
    expect(mockStat).toHaveBeenCalledWith('test.md');
  });

  it('should fallback to mtime when git command returns empty string', () => {
    const mockExec = vi.fn().mockReturnValue('');

    const mockMtime = new Date('2022-02-01T00:00:00.000Z');
    const mockStat = vi.fn().mockReturnValue({ mtime: mockMtime });

    const date = getFileGitDate('test.md', { exec: mockExec, stat: mockStat });

    expect(date.toISOString()).toBe(mockMtime.toISOString());
    expect(mockStat).toHaveBeenCalled();
  });
});