# stars-feature-add-multi-language-game-name-search-support.md

## 版本記錄

| 版本 | 更新時間 | 變更摘要 |
|------|---------|----------|
| v1.0 | 2026-01-28 14:45 | 初次審查：新增多語系遊戲名稱模糊搜尋功能 |

---

## 變更摘要

| 項目 | 內容 |
|-----|-----|
| 變更檔案數 | 2 個 (`app/Services/Games.php`, `app/Services/ProviderGames.php`) |
| 變更類型 | 新功能 |
| 影響範圍 | 遊戲列表搜尋 API (`/api/backend/game/list`, `/api/backend/provider_game/list`) |

---

## 問題清單

### 🔴 嚴重（必須修復）
| 檔案:行號 | 問題描述 | 建議修復 |
|----------|---------|---------| 
| `app/Services/ProviderGames.php:547` | **Undefined Array Key 風險**：`$queryColumn` 雖然定義了可選欄位，但在處理 `$opts['column']` 時未檢查傳入的欄位是否存在於 `$queryColumn` 中。若呼叫端傳入無效欄位，將導致 500 錯誤。 | 增加 `isset` 檢查：`if (isset($queryColumn[$value])) { $column[] = $queryColumn[$value]; }` |

### 🟡 警告（建議修復）
| 檔案:行號 | 問題描述 | 建議修復 |
|----------|---------|---------| 
| `app/Services/ProviderGames.php:516` | **N+1 查詢隱憂**：`whereExists` 子查詢在資料量大時可能會有效能影響，尤其是 `game_language` 表若無適當索引。 | 確保 `game_language` 表的 `game_id` 與 `name` 欄位有建立複合索引或獨立索引以優化 `LIKE` 搜尋（雖 LIKE 前綴 `%` 無法使用索引，但 `game_id` 可用）。 |
| `app/Services/ProviderGames.php:524` | **邏輯重複**：`ProviderGames.php` 與 `Games.php` 中有完全相同的搜尋邏輯代碼。 | 違反 DRY 原則。建議將此搜尋邏輯提取為 `Games` Model 的 `Scope` (e.g., `scopeSearchByName($query, $keyword)`)，供兩處重複使用。 |

### 🔵 建議（可選修復）
| 檔案:行號 | 問題描述 | 建議修復 |
|----------|---------|---------| 
| `app/Services/ProviderGames.php:511` | **巢狀層級過深**：多層 `if` 與 `closure` 讓程式碼閱讀稍微困難。 | 可使用 Early Return 或提取方法來簡化結構。 |

---

## 審查結論

針對您的提問：**`$queryColumn` 是否會影響此次功能？**

**結論：不會直接影響搜尋結果，但存在潛在風險。**

1.  **功能面**：此次變更是在 SQL 的 `WHERE` 子句中增加篩選邏輯（使用 `orWhereExists`），這與 `$queryColumn` 控制的 `SELECT` 欄位是分開的。只要 `$queryColumn` 中依然包含 `games.id`（用於 Join 與識別），搜尋與回傳資料就不會受影響。多語系名稱的「顯示」是在後續的 `format()` 方法中處理，與這裡的 SQL 查詢無關。
2.  **風險面**：`listsByProviderGames` 方法依賴外部傳入的 `$opts['column']` 來決定 `$queryColumn` 的映射。若前端或呼叫端因為某些原因傳入了不存在於 `$queryColumn` 的欄位名稱，程式會直接崩潰。建議藉此機會修復此隱患。

### 各類別評分

| 類別 | 權重 | 得分 | 狀態 | 說明 |
|-----|-----|-----|-----|-----|
| SOLID 原則 | 25% | 85 | ✅ | 職責單一，但有重複代碼問題。 |
| 程式碼品質 | 20% | 75 | ⚠️ | 存在重複邏輯與潛在 Runtime Error 風險。 |
| 功能正確性 | 15% | 95 | ✅ | 搜尋邏輯正確，使用子查詢處理一對多關聯搜尋。 |
| 安全性 | 15% | 90 | ✅ | 使用參數綁定，無 SQL Injection 風險。 |
| 多層架構 | 15% | 90 | ✅ | 符合 Service 層規範。 |
| 效能 | 5% | 80 | ✅ | 使用 `EXISTS` 替代 `JOIN` 通常較有效率，但需注意索引。 |
| 可測試性 | 5% | 80 | ✅ | 邏輯清晰，可單元測試。 |

### 總分計算

**加權總分**：**85** / 100

### 合併判定

| 分數區間 | 判定 | 行動 |
|---------|-----|-----|
| 70-89 | ⚠️ 良好 | 修復警告後可合併 |

**最終結論**：⚠️ 修復後可合併
