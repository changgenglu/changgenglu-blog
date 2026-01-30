---
name: "notion-database-architect"
description: "當使用者要求將資料結構化為 Notion Database、建立 In-line 資料庫或設定複雜屬性（如 Checkbox, Select, Formula）時觸發。"
version: "1.0.0"
---

# Notion Database Architect Skill

## 🧠 Expertise
專精於 Notion 資料庫建模，能將平鋪的文字或表格資料轉化為具有高度互動性的 Notion 資料庫。

---

## 1. 資料庫建立規範 (POST /v1/databases)
- **版本差異注意**：2025-09-03 後版本區分 Database 與 Data Source。若 `API-create-a-data-source` 建立失敗，改用「混合協作模式」。

## 2. 混合協作協議 (Hybrid Implementation)
- **手動框架**：若自動建立失敗，引導使用者手動在 Notion 建立資料庫並設定屬性（如：名稱、Checkbox、ID）。
- **自動填充**：使用者提供 `database_id` 後，AI 負責執行全量資料解析、格式轉換與批次寫入（POST /v1/pages）。

## 2. 資料導入規範 (POST /v1/pages)
- **父層指向**：`parent` 必須設定為 `{ "database_id": "DATABASE_ID" }`。
- **Checkbox 賦值**：
    - 若原始資料為 `V`, `v`, `1` 或 `true` -> 映射為 `true`。
    - 若原始資料為空、`null` 或 `false` -> 映射為 `false`。

## 3. 轉換策略：從 Markdown 到 Database
- **標題層級映射**：Markdown 的 `##` 或 `###` 標題可作為資料庫的分類標籤 (Select/Multi-select) 或獨立的 In-line Database 名稱。
- **表格列映射**：Markdown 表格的每一行對應資料庫中的一個頁面項目 (Row)。

# Constraints
- 呼叫工具前，必須先透過 `API-retrieve-a-page` 確認父頁面 ID。
- 在大量導入資料前（超過 10 筆），應先建立資料庫 Schema 並匯入一筆測試資料驗證格式。
