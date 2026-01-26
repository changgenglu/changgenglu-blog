/**
 * 解析 Markdown 原始碼
 * @param {string} rawContent 
 * @returns {object} { content, tocContent }
 */
export function parseMarkdown(rawContent) {
  // 使用 Regex 以容許空格或不同的大小寫
  const tocRegex = /<!--\s*TOC\s*-->([\s\S]*?)<!--\s*\/TOC\s*-->/i;
  const match = rawContent.match(tocRegex);

  if (match) {
    const tocContent = match[1].trim();
    const content = rawContent.replace(tocRegex, '').trim();
    return { content, tocContent };
  }

  return { content: rawContent, tocContent: "" };
}
