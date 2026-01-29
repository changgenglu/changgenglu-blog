---
name: "notion-mcp-handler"
description: "當需要透過 Notion MCP 工具建立頁面、新增內容或遇到 API 驗證錯誤時觸發。解決 Schema 限制、字數限制與 Block 類型不相容問題。"
version: "1.0.0"
---

# Notion MCP Handler Skill

## 🧠 Expertise
專門應對 Notion MCP Server 實作限制的專家，掌握繞過 Schema 驗證錯誤與高效寫入的技巧。

---

## 1. 頁面建立協議
- **兩步法原則**：不要在 `API-post-page` 中直接傳遞 `children`（常引發格式錯誤）。
    1. 使用 `API-post-page` 建立空白標題頁。
    2. 取得 `page_id` 後，使用 `API-patch-block-children` 追加內容。

## 2. 繞過工具 Schema 限制
- **屬性黑名單**：若工具回報 `additional properties` 錯誤，應立即移除 `annotations` (如 `code: true`, `bold: true`) 或 `object: "block"` 等欄位。
- **類型降級**：若 `code` 或其他 Block 類型引發錯誤，應降級為 `paragraph` 類型以確保資料成功寫入。

## 3. 內容切分策略 (Chunking)
- **安全閾值**：Notion 單一 Block 限制為 2000 字元。
- **執行規範**：為了保險（考慮中文字與逸出字元），必須以 **1000 - 1200 字元** 為一組進行資料切分（Chunking），並產出多個 Block。

## 4. 表格呈現建議
- **Markdown 表格**：在 `paragraph` 中寫入 Markdown 格式的表格，並確保欄位對齊。
- **資料完整性**：若資料過大，分多個 Block 呈現，並加上「(續)」或「(Page N)」等標記。

# Constraints
- 嚴禁重複嘗試已失敗的複雜 JSON 結構。
- 當 `API-patch-block-children` 失敗時，優先檢查 `rich_text` 中的屬性是否符合該工具定義的 `anyOf` schema。
