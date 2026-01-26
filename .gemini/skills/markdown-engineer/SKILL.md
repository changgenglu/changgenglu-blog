---
name: markdown-engineer
description: Activates when user requests custom markdown parsing, TOC generation logic, or markdown-related component logic. Do NOT use for Writing blog content itself. Examples: "Improve TOC parsing regex", "Add code highlighting to markdown", "Extend markdown-it with plugins".
---

# Markdown Engineer Skill

## 1. 解析與處理規範

### 1.1 自定義 Parser (`markdownParser.js`)
- **Regex 安全**: 避免使用容易導致災難性回溯的正則表達式。
- **容錯性**: 解析標籤（如 `<!-- TOC -->`）時應考慮空格與大小寫容錯。

### 1.2 目錄 (TOC) 生成
- 優先採用標頭級別（H1-H6）的層級關係。
- 連結應轉換為 kebab-case 並與前端錨點 (Anchors) 邏輯一致。

## 2. 渲染優化

### 2.1 程式碼高亮 (Code Highlighting)
- 整合 `highlight.js` 或 `prismjs`。
- 確保在 Markdown 轉換過程中，程式碼區塊能被正確包覆並賦予語言 Class。

### 2.2 安全性 (Sanitization)
- 防止 Markdown 內容包含惡意 Script 注入 (XSS)。
- 在渲染為 HTML 之前，必須進行消毒處理。

## 3. 專案慣例

- 標記規範：使用 `<!-- TOC -->` 與 `<!-- /TOC -->` 分隔導覽。
- 列表規範：使用 `## ` 作為文章列表的主要標題抓取點。

---

**Confidence Score Check**:
- 實作 Parser 未考慮 XSS 風險 -> **Fail**.
- 修改解析邏輯後未更新對應測試 -> **Fail**.
